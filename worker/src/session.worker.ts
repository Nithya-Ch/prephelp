import fs from "node:fs";
import path from "node:path";
import type { Job } from "bullmq";
import {
  Session, Analysis, Feedback, LearnerProfile, Recommendation, Exercise,
} from "./models.js";
import { config } from "./config.js";

export interface SessionJobData {
  sessionId: string;
}

/**
 * Full analysis workflow for a submitted session:
 * 1. Set status → processing
 * 2. Call ML /analyze/speech or /analyze/text → save Analysis
 * 3. Call ML /profile/update → save LearnerProfile snapshot
 * 4. Call ML /planner/next → save Recommendation
 * 5. Call ML /coach/feedback → save Feedback
 * 6. Set status → complete
 */
export async function processSessionJob(
  job: Job<SessionJobData>
): Promise<void> {
  const { sessionId } = job.data;
  console.log(`[Worker] Processing session: ${sessionId}`);

  const session = await Session.findById(sessionId).populate("exerciseId");
  if (!session) throw new Error(`Session ${sessionId} not found`);

  session.status = "processing";
  await session.save();

  try {
    const exercise = session.exerciseId as any;
    // For situational exercises, use the stored question text as the effective prompt
    const effectivePrompt: string =
      (session as any).questionText || exercise?.prompt || "Interview response";

    // ─── Step 1: Analysis ───
    let mlResult: any;

    if (session.mode === "voice") {
      if (!session.audioPath) throw new Error("Voice session missing audioPath");
      if (!fs.existsSync(session.audioPath)) throw new Error(`Audio file missing: ${session.audioPath}`);

      const fileBuffer = await fs.promises.readFile(session.audioPath);
      const filename = path.basename(session.audioPath) || "recording.webm";
      const formData = new FormData();
      formData.append("file", new Blob([fileBuffer]), filename);
      formData.append("sessionId", sessionId);
      if (exercise?.prompt) formData.append("exercisePrompt", effectivePrompt);
      if (exercise?.type) formData.append("exerciseType", exercise.type);
      if (exercise?.referenceText) formData.append("referenceText", exercise.referenceText);

      const res = await fetch(`${config.ML_SERVICE_URL}/analyze/speech`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`/analyze/speech ${res.status}: ${await res.text().catch(() => "")}`);
      mlResult = await res.json();
    } else if (session.mode === "text") {
      const res = await fetch(`${config.ML_SERVICE_URL}/analyze/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: session.text || "",
          exercisePrompt: effectivePrompt,
          exerciseType: exercise?.type || "interview",
          referenceText: exercise?.referenceText || null,
        }),
      });
      if (!res.ok) throw new Error(`/analyze/text ${res.status}: ${await res.text().catch(() => "")}`);
      mlResult = await res.json();
    } else {
      throw new Error(`Unsupported mode '${session.mode}'`);
    }

    const analysisDoc = await Analysis.create({
      sessionId: session._id,
      transcript: mlResult.transcript || mlResult.text || "",
      words: mlResult.words || [],
      metrics: mlResult.metrics || {},
      scores: mlResult.scores || {},
      flags: mlResult.flags || [],
      errorPatterns: mlResult.errorPatterns || {},
      llmUsed: mlResult.llmUsed ?? false,
      fallbackUsed: mlResult.fallbackUsed ?? false,
      versions: mlResult.versions || { formulaVersion: "1.0.0" },
    });
    session.analysisId = analysisDoc._id;

    // ─── Step 2: Profile Update ───
    try {
      const userId = session.userId.toString();
      const latestProfile = await LearnerProfile.findOne({ userId: session.userId }).sort({ updatedAt: -1 });

      const currentDims: Record<string, any> = {};
      const recentScores: Record<string, number[]> = {};

      if (latestProfile?.dimensions) {
        const dims = latestProfile.dimensions instanceof Map
          ? Object.fromEntries(latestProfile.dimensions)
          : latestProfile.dimensions;
        for (const [k, v] of Object.entries(dims)) {
          currentDims[k] = v;
        }
      }

      // Build recent scores from last 5 sessions
      const recentSessions = await Analysis.find({
        sessionId: { $in: await Session.find({ userId: session.userId }).select("_id").limit(6).then(s => s.map(x => x._id)) },
      }).sort({ createdAt: -1 }).limit(5);

      for (const rs of recentSessions) {
        const sc = rs.scores as any;
        if (sc) {
          for (const [dim, val] of Object.entries(sc)) {
            if (val != null && typeof val === "number") {
              if (!recentScores[dim]) recentScores[dim] = [];
              recentScores[dim].push(val as number);
            }
          }
        }
      }

      const profileRes = await fetch(`${config.ML_SERVICE_URL}/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentProfile: currentDims,
          sessionScores: mlResult.scores || {},
          exerciseDifficulty: exercise?.difficulty || 50,
          method: "ema",
          recentScores,
          errorPatterns: mlResult.errorPatterns || {},
        }),
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const newDims: Record<string, any> = {};
        for (const [dim, upd] of Object.entries(profileData.updatedDimensions as Record<string, any>)) {
          newDims[dim] = {
            score: upd.score,
            uncertainty: upd.uncertainty,
            trend: upd.trend,
            lastPracticed: new Date(),
            attempts: upd.attempts,
          };
        }

        await LearnerProfile.create({
          userId: session.userId,
          sessionId: session._id,
          dimensions: newDims,
          errorPatterns: profileData.errorPatterns || {},
        });
        console.log(`[Worker] Profile snapshot saved for user ${userId}`);
      }
    } catch (profErr: any) {
      console.warn(`[Worker] Profile update failed (non-fatal): ${profErr.message}`);
    }

    // ─── Step 3: Planner ───
    try {
      const allExercises = await Exercise.find({ isActive: true });
      const recentSessionDocs = await Session.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("exerciseId");
      const recentIds = recentSessionDocs.map((s) => s.exerciseId?.toString()).filter(Boolean);

      const latestProfile = await LearnerProfile.findOne({ userId: session.userId }).sort({ updatedAt: -1 });
      const profileDims: Record<string, any> = {};
      if (latestProfile?.dimensions) {
        const dims = latestProfile.dimensions instanceof Map
          ? Object.fromEntries(latestProfile.dimensions)
          : latestProfile.dimensions;
        for (const [k, v] of Object.entries(dims)) {
          profileDims[k] = v;
        }
      }

      const candidates = allExercises.map((ex) => ({
        exerciseId: ex._id.toString(),
        targetSkills: ex.targetSkills || [],
        difficulty: ex.difficulty || 50,
        type: ex.type || "interview",
        tags: ex.tags || [],
      }));

      const attempts = Object.values(profileDims).reduce((sum: number, d: any) => sum + (d?.attempts || 0), 0);
      const coldStart = attempts < 3;

      const planRes = await fetch(`${config.ML_SERVICE_URL}/planner/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId.toString(),
          profile: profileDims,
          candidates,
          recentExerciseIds: recentIds,
          strategy: "rule",
          coldStart,
          diagnosticSetIds: candidates.slice(0, 3).map((c) => c.exerciseId),
        }),
      });

      if (planRes.ok) {
        const planData = await planRes.json();
        if (planData.exerciseId) {
          const recDoc = await Recommendation.create({
            userId: session.userId,
            sessionId: session._id,
            exerciseId: planData.exerciseId,
            strategy: planData.strategy,
            explanation: planData.explanation,
            factors: planData.factors || {},
          });
          session.recommendationId = recDoc._id;
          console.log(`[Worker] Recommendation saved: ${planData.exerciseId} (${planData.strategy})`);
        }
      }
    } catch (planErr: any) {
      console.warn(`[Worker] Planner failed (non-fatal): ${planErr.message}`);
    }

    // ─── Step 4: Coach Feedback ───
    try {
      const fbRes = await fetch(`${config.ML_SERVICE_URL}/coach/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          exercisePrompt: effectivePrompt,
          exerciseType: exercise?.type || "interview",
          transcript: mlResult.transcript || mlResult.text || "",
          scores: mlResult.scores || {},
          metrics: mlResult.metrics || {},
        }),
      });

      if (fbRes.ok) {
        const fbData = await fbRes.json();
        await Feedback.create({
          sessionId: session._id,
          summary: fbData.summary,
          strengths: fbData.strengths || [],
          improvements: fbData.improvements || [],
          sentenceExamples: fbData.sentenceExamples || [],
          tip: fbData.tip,
          fallbackUsed: fbData.fallbackUsed ?? false,
        });
        console.log(`[Worker] Feedback saved for session ${sessionId}`);
      }
    } catch (fbErr: any) {
      console.warn(`[Worker] Coach feedback failed (non-fatal): ${fbErr.message}`);
    }

    // ─── Done ───
    session.status = "complete";
    session.errorCode = undefined;
    await session.save();
    console.log(`[Worker] Session ${sessionId} complete.`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] Failed session ${sessionId}: ${msg}`);
    session.status = "failed";
    session.errorCode = msg;
    await session.save();
    throw err;
  }
}
