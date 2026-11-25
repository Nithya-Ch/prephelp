import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { Types } from "mongoose";
import { Session } from "../models/session.model.js";
import { Exercise } from "../models/exercise.model.js";
import { Feedback } from "../models/feedback.model.js";
import { createSessionSchema } from "../schemas/session.schema.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { config } from "../config.js";
import { saveFile } from "../lib/storage.js";
import { enqueueSession } from "../queue/session.producer.js";
import { redisConnection } from "../queue/connection.js";
import { processSessionDirectly } from "../lib/direct-processor.js";

export const sessionRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_AUDIO_MB * 1024 * 1024,
  },
});

sessionRouter.post(
  "/",
  requireAuth,
  upload.single("audio"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createSessionSchema.parse(req.body);
      const userId = new Types.ObjectId(req.user!.userId);

      // Infer exercise category/type from input
      const reqExerciseId = (parsed.exerciseId || "").toLowerCase();
      const reqType = (parsed.exerciseType || "").toLowerCase();

      let targetType = "professional-introduction";
      if (reqType) {
        targetType = reqType;
      } else if (
        reqExerciseId.includes("read-aloud") ||
        reqExerciseId.startsWith("ra-") ||
        reqExerciseId.includes("passage")
      ) {
        targetType = "read-aloud";
      } else if (reqExerciseId.includes("situation")) {
        targetType = "situational";
      } else if (
        reqExerciseId.includes("extempore") ||
        reqExerciseId.includes("topic")
      ) {
        targetType = "extempore";
      } else if (
        reqExerciseId.includes("pronunciation") ||
        reqExerciseId.includes("word")
      ) {
        targetType = "pronunciation";
      } else if (
        reqExerciseId.includes("rapid") ||
        reqExerciseId.includes("fire")
      ) {
        targetType = "rapid-fire";
      } else if (reqExerciseId.includes("interview")) {
        targetType = "interview";
      }

      // Resilient exercise resolution: handle ObjectId, slugs, or empty DB
      let exerciseDoc: any = null;
      if (Types.ObjectId.isValid(parsed.exerciseId)) {
        exerciseDoc = await Exercise.findById(parsed.exerciseId);
      }

      if (!exerciseDoc) {
        exerciseDoc = await Exercise.findOne({
          type: targetType,
          isActive: true,
        });
      }

      if (!exerciseDoc) {
        exerciseDoc = await Exercise.findOne({
          $or: [
            { type: parsed.exerciseId },
            { tags: parsed.exerciseId },
          ],
        });
      }

      if (!exerciseDoc) {
        // Auto-create type-specific exercise so session creation never crashes
        const defaultsByType: Record<string, Partial<any>> = {
          "read-aloud": {
            type: "read-aloud",
            prompt:
              parsed.exerciseTitle ||
              "Read the passage aloud clearly, paying attention to natural cadence.",
            referenceText:
              parsed.referenceText ||
              "Cognitive architecture theory suggests working memory capacity is strictly constrained during high-stakes verbal retrieval. By pacing vocal inflection deliberately, communicators preserve attentional bandwidth.",
            targetSkills: ["pronunciation", "pacing", "fluency"],
            difficulty: 35,
            timeLimitSec: 90,
            prepTimeSec: 15,
            tags: ["read-aloud", "intermediate"],
          },
          situational: {
            type: "situational",
            prompt: parsed.questionText || "Situational Practice Question",
            targetSkills: ["reasoning", "communication", "structure", "relevance"],
            difficulty: 55,
            timeLimitSec: 150,
            prepTimeSec: 20,
            tags: ["situational", "general"],
          },
          extempore: {
            type: "extempore",
            prompt: parsed.questionText || "Extempore Speaking Prompt",
            targetSkills: ["spontaneous-speaking", "structure", "fluency", "depth"],
            difficulty: 60,
            timeLimitSec: 120,
            prepTimeSec: 30,
            tags: ["extempore", "spontaneous"],
          },
          pronunciation: {
            type: "pronunciation",
            prompt: parsed.referenceText || "Pronunciation Practice Word",
            referenceText: parsed.referenceText || "articulation",
            targetSkills: ["articulation", "enunciation", "phonetic-accuracy"],
            difficulty: 40,
            timeLimitSec: 15,
            prepTimeSec: 5,
            tags: ["pronunciation", "word-level"],
          },
          "rapid-fire": {
            type: "rapid-fire",
            prompt: "Interview Rapid Fire Session (10 Questions)",
            targetSkills: ["stamina", "consistency", "structure", "versatility"],
            difficulty: 70,
            timeLimitSec: 90,
            prepTimeSec: 15,
            tags: ["rapid-fire", "interview"],
          },
          "professional-introduction": {
            type: "professional-introduction",
            prompt:
              "Introduce yourself in 60–90 seconds. Include your name, educational background, one key strength, and what you are looking for in your next role.",
            targetSkills: ["grammar", "structure", "clarity", "professional-tone"],
            difficulty: 30,
            timeLimitSec: 90,
            prepTimeSec: 20,
            tags: ["introduction", "beginner", "professional-introduction"],
          },
        };

        const template = defaultsByType[targetType] || defaultsByType["professional-introduction"];
        exerciseDoc = await Exercise.create({
          ...template,
          isActive: true,
          source: "seed",
          reviewed: true,
        });
      }

      let audioPath: string | undefined;
      let textContent: string | undefined;

      if (parsed.mode === "voice") {
        if (!req.file) {
          res.status(400).json({
            error: {
              code: "AUDIO_REQUIRED",
              message: "An audio file is required for voice mode",
            },
          });
          return;
        }

        const validMime =
          req.file.mimetype.startsWith("audio/") ||
          req.file.mimetype === "video/webm";

        if (!validMime) {
          res.status(400).json({
            error: {
              code: "INVALID_FILE_TYPE",
              message: "Invalid file type. Only audio files or webm recordings are allowed",
            },
          });
          return;
        }

        const ext =
          path.extname(req.file.originalname) ||
          (req.file.mimetype.includes("webm") ? ".webm" : ".wav");
        const filename = `${uuidv4()}${ext}`;
        audioPath = await saveFile(req.file, filename);
      } else if (parsed.mode === "text") {
        if (!parsed.text || parsed.text.trim().length < 10) {
          res.status(400).json({
            error: {
              code: "TEXT_TOO_SHORT",
              message: "Text response must be at least 10 characters long",
            },
          });
          return;
        }
        textContent = parsed.text.trim();
      }

      const session = await Session.create({
        userId,
        exerciseId: exerciseDoc._id,
        mode: parsed.mode,
        audioPath,
        text: textContent,
        status: "queued",
        referenceText: parsed.referenceText || exerciseDoc.referenceText,
        exerciseType: targetType,
        questionText: parsed.questionText,
        questionId:
          parsed.questionId && Types.ObjectId.isValid(parsed.questionId)
            ? new Types.ObjectId(parsed.questionId)
            : undefined,
        questionCategory: parsed.questionCategory,
      });

      // Attempt Redis BullMQ queue; if Redis is down or offline, fall back immediately to in-process analysis
      let enqueued = false;
      if (redisConnection.status === "ready") {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Redis enqueue timed out")), 1000)
          );
          await Promise.race([
            enqueueSession(session._id.toString()),
            timeoutPromise,
          ]);
          enqueued = true;
        } catch (queueErr: any) {
          console.warn(
            `[Session] Redis queue unavailable (${queueErr.message}), falling back to direct processor`
          );
        }
      }

      if (!enqueued) {
        processSessionDirectly(session._id.toString()).catch((procErr) => {
          console.error(`[Session] In-process analysis error:`, procErr);
        });
      }

      res.status(201).json({
        sessionId: session._id.toString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/sessions/recent
 * Returns the authenticated user's recent sessions (populated with exercise and feedback).
 */
sessionRouter.get(
  "/recent",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await Session.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("exerciseId")
        .populate("analysisId")
        .lean();

      // Attach feedback to each session if present
      const sessionIds = sessions.map((s) => s._id);
      const feedbacks = await Feedback.find({ sessionId: { $in: sessionIds } }).lean();
      const fbMap = new Map(feedbacks.map((f) => [f.sessionId.toString(), f]));

      const enriched = sessions.map((s) => {
        const fb = fbMap.get(s._id.toString());
        return {
          ...s,
          feedback: fb || null,
        };
      });

      res.status(200).json({ sessions: enriched });
    } catch (err) {
      next(err);
    }
  }
);

sessionRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const session = await Session.findOne({
        _id: sessionId,
        userId: req.user!.userId,
      })
        .populate("exerciseId")
        .populate("analysisId");

      if (!session) {
        res.status(404).json({
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Session not found",
          },
        });
        return;
      }

      // Attach feedback document if it exists
      const feedback = await Feedback.findOne({ sessionId: session._id });
      const sessionObj: any = session.toObject();
      sessionObj.id = session._id.toString();
      sessionObj.feedback = feedback ? feedback.toObject() : null;

      if (session.analysisId && typeof session.analysisId === "object") {
        const a: any = session.analysisId;
        sessionObj.transcript = a.transcript || "";
        sessionObj.metrics = a.metrics || {};
        sessionObj.scores = a.scores || {};
        sessionObj.words = a.words || [];
      }

      res.status(200).json(sessionObj);
    } catch (err) {
      next(err);
    }
  }
);

sessionRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await Session.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("exerciseId");

      res.status(200).json({ sessions });
    } catch (err) {
      next(err);
    }
  }
);
