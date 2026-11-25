import { Router, type Request, type Response, type NextFunction } from "express";
import { LearnerProfile } from "../models/learner-profile.model.js";
import { Recommendation } from "../models/recommendation.model.js";
import { Session } from "../models/session.model.js";
import { Exercise } from "../models/exercise.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { Types } from "mongoose";

export const profileRouter = Router();

// GET /api/profile - Fetch current user's latest learner profile snapshot
profileRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const latestProfile = await LearnerProfile.findOne({ userId })
        .sort({ updatedAt: -1 })
        .populate("sessionId");

      if (!latestProfile) {
        // Return default uncalibrated baseline
        res.status(200).json({
          dimensions: {
            grammar: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            vocabulary: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            fluency: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            pace: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            filler_control: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            structure: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            confidence: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
          },
          errorPatterns: {},
          isBaseline: true,
        });
        return;
      }

      res.status(200).json(latestProfile);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/recommendation - Fetch user's latest next-exercise recommendation
profileRouter.get(
  "/recommendation",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const rec = await Recommendation.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate("exerciseId");

      res.status(200).json({ recommendation: rec });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/history - Fetch profile progression history
profileRouter.get(
  "/history",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const snapshots = await LearnerProfile.find({ userId })
        .sort({ updatedAt: 1 })
        .limit(20);

      res.status(200).json({ snapshots });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/profile/dashboard - Unified overview across all completed exercises
profileRouter.get(
  "/dashboard",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);

      // Total completed sessions
      const completedSessions = await Session.find({
        userId,
        status: "complete",
      })
        .populate("exerciseId")
        .sort({ createdAt: -1 })
        .lean();

      const totalCompleted = completedSessions.length;

      // Exercise-wise breakdown
      const breakdown: Record<string, number> = {
        "professional-introduction": 0,
        "read-aloud": 0,
        situational: 0,
        extempore: 0,
        pronunciation: 0,
        "rapid-fire": 0,
      };

      for (const s of completedSessions) {
        const ex = s.exerciseId as any;
        const type = ex?.type || "other";
        if (type in breakdown) {
          breakdown[type]++;
        } else {
          breakdown[type] = (breakdown[type] || 0) + 1;
        }
      }

      // Latest profile & recommendation
      const latestProfile = await LearnerProfile.findOne({ userId })
        .sort({ updatedAt: -1 })
        .lean();

      let rec = await Recommendation.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate("exerciseId")
        .lean();

      // If no recommendation exists yet or cold start, pick a suitable starting exercise
      if (!rec) {
        const defaultEx = await Exercise.findOne({
          type: "professional-introduction",
          isActive: true,
        }).lean();

        rec = {
          _id: new Types.ObjectId(),
          userId,
          exerciseId: defaultEx as any,
          strategy: "starting_drill",
          explanation:
            "Start by practicing your professional introduction to calibrate your verbal fluency baseline.",
          factors: {},
          createdAt: new Date(),
        } as any;
      }

      // Compute strongest and weakest areas
      let strongestArea: { dimension: string; score: number } | null = null;
      let weakestArea: { dimension: string; score: number } | null = null;

      if (latestProfile?.dimensions) {
        const dims =
          latestProfile.dimensions instanceof Map
            ? Object.fromEntries(latestProfile.dimensions)
            : latestProfile.dimensions;

        const entries = Object.entries(dims as Record<string, any>).map(
          ([k, v]) => ({
            dimension: k,
            score: Math.round(v?.score ?? 50),
          })
        );

        if (entries.length > 0) {
          entries.sort((a, b) => b.score - a.score);
          strongestArea = entries[0];
          weakestArea = entries[entries.length - 1];
        }
      }

      res.status(200).json({
        totalCompleted,
        breakdown,
        profile: latestProfile || {
          dimensions: {
            grammar: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            vocabulary: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            fluency: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            pace: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            filler_control: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            structure: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
            confidence: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
          },
          isBaseline: true,
        },
        recommendation: rec,
        strongestArea,
        weakestArea,
      });
    } catch (err) {
      next(err);
    }
  }
);
