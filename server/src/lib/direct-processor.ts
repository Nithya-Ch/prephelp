import fs from "node:fs";
import path from "node:path";
import {
  Session,
  Analysis,
  Feedback,
  LearnerProfile,
  Recommendation,
  Exercise,
} from "../models/index.js";
import { config } from "../config.js";

/**
 * In-process session processor used when Redis / BullMQ queue is unavailable.
 * Mirrors worker analysis workflow:
 * 1. Set status → processing
 * 2. Call ML /analyze/speech (no fake fallback: fails if the ML service is down)
 * 3. Update LearnerProfile & Recommendation
 * 4. Generate Feedback & set status → complete
 */
export async function processSessionDirectly(sessionId: string): Promise<void> {
  console.log(`[DirectProcessor] Processing session: ${sessionId}`);
  const session = await Session.findById(sessionId).populate("exerciseId");
  if (!session) return;

  session.status = "processing";
  await session.save();

  try {
    const exercise = session.exerciseId as any;
    const exType: string =
      session.exerciseType || exercise?.type || "interview";
    const refText: string =
      session.referenceText || exercise?.referenceText || "";
    const effectivePrompt: string =
      session.questionText || exercise?.prompt || "Professional response";

    let mlResult: any = null;
    let mlError = "";

    const isVoiceSession = session.mode === "voice" || (session.mode as string) === "audio";

    console.log(
      `[DirectProcessor] mode=${session.mode} audioPath=${session.audioPath} exists=${
        session.audioPath ? fs.existsSync(session.audioPath) : false
      }`
    );

    // Call ML service if audio exists
    if (isVoiceSession && session.audioPath && fs.existsSync(session.audioPath)) {
      try {
        const fileBuffer = await fs.promises.readFile(session.audioPath);
        const filename = path.basename(session.audioPath) || "recording.webm";
        const formData = new FormData();
        formData.append("file", new Blob([fileBuffer]), filename);
        formData.append("sessionId", sessionId);
        if (effectivePrompt) formData.append("exercisePrompt", effectivePrompt);
        if (exType) formData.append("exerciseType", exType);
        if (refText) formData.append("referenceText", refText);

        const res = await fetch(`${config.ML_SERVICE_URL}/analyze/speech`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          mlResult = await res.json();
        } else {
          const body = await res.text().catch(() => "");
          mlError = `ML service responded ${res.status}. ${body.slice(0, 200)}`;
          console.warn(`[DirectProcessor] ${mlError}`);
        }
      } catch (mlErr: any) {
        mlError = `ML service unreachable at ${config.ML_SERVICE_URL} (${mlErr.message})`;
        console.warn(`[DirectProcessor] ${mlError}`);
      }
    } else if (isVoiceSession) {
      mlError = `Audio file not found on the server (audioPath: ${session.audioPath})`;
      console.warn(`[DirectProcessor] ${mlError}`);
    } else {
      mlError = `Session mode "${session.mode}" is not supported by this processor (voice recordings only).`;
      console.warn(`[DirectProcessor] ${mlError}`);
    }

    // No fake data: if there is no real result, fail loudly
    if (!mlResult) {
      throw new Error(
        mlError ||
          `Speech analysis service is unavailable at ${config.ML_SERVICE_URL}. Start the ML service and try again.`
      );
    }

    // Save Analysis
    const analysisDoc = await Analysis.create({
      sessionId: session._id,
      transcript: mlResult.transcript || "",
      words: mlResult.words || [],
      metrics: mlResult.metrics || {},
      scores: mlResult.scores || {},
      flags: mlResult.flags || [],
      errorPatterns: mlResult.errorPatterns || {},
      llmUsed: false,
      fallbackUsed: false,
      versions: { formulaVersion: "1.0.0" },
    });
    session.analysisId = analysisDoc._id;

    // Call ML Coach feedback
    let feedbackData: any = null;
    try {
      const fbRes = await fetch(`${config.ML_SERVICE_URL}/coach/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          exercisePrompt: effectivePrompt,
          exerciseType: exType,
          transcript: mlResult.transcript || "",
          scores: mlResult.scores || {},
          metrics: mlResult.metrics || {},
        }),
      });

      if (fbRes.ok) {
        feedbackData = await fbRes.json();
      } else {
        console.warn(`[DirectProcessor] Coach feedback responded ${fbRes.status}`);
      }
    } catch (fbErr: any) {
      console.warn(`[DirectProcessor] Coach feedback unreachable (${fbErr.message})`);
    }

    // Honest fallback: no invented praise, just say feedback is unavailable
    if (!feedbackData) {
      feedbackData = {
        summary:
          "Your speech was transcribed and scored, but written coaching feedback is unavailable right now.",
        strengths: [],
        improvements: [],
        sentenceExamples: [],
        tip: "",
        fallbackUsed: true,
      };
    }

    await Feedback.create({
      sessionId: session._id,
      summary: feedbackData.summary,
      strengths: feedbackData.strengths || [],
      improvements: feedbackData.improvements || [],
      sentenceExamples: feedbackData.sentenceExamples || [],
      tip: feedbackData.tip,
      fallbackUsed: !!feedbackData.fallbackUsed,
    });

    // Update Learner Profile snapshot
    try {
      const newDims: Record<string, any> = {};
      const scoreObj = mlResult.scores || {};
      for (const [dim, val] of Object.entries(scoreObj)) {
        if (typeof val === "number") {
          newDims[dim] = {
            score: val,
            uncertainty: 20,
            trend: 2,
            lastPracticed: new Date(),
            attempts: 1,
          };
        }
      }

      await LearnerProfile.create({
        userId: session.userId,
        sessionId: session._id,
        dimensions: newDims,
        errorPatterns: mlResult.errorPatterns || {},
      });
    } catch (profErr: any) {
      console.warn(`[DirectProcessor] Profile snapshot error: ${profErr.message}`);
    }

    // Finalize session
    session.status = "complete";
    session.errorCode = undefined;
    await session.save();
    console.log(`[DirectProcessor] Session ${sessionId} marked complete.`);
  } catch (err: any) {
    console.error(`[DirectProcessor] Direct processing failed:`, err);
    session.status = "failed";
    session.errorCode = err.message || "Processing error";
    await session.save();
  }
}