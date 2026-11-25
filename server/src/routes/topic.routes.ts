import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { Topic, type TopicCategory } from "../models/topic.model.js";
import { TopicHistory } from "../models/topic-history.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { Types } from "mongoose";

export const topicRouter = Router();

/**
 * GET /api/topics/next
 * Returns the next unattempted topic for the authenticated user.
 * Query params:
 *   category?: TopicCategory
 */
topicRouter.get(
  "/next",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { category } = req.query;

      const filter: Record<string, unknown> = { isActive: true };
      if (category && typeof category === "string") {
        filter.category = category;
      }

      const allTopics = await Topic.find(filter).lean();

      if (allTopics.length === 0) {
        res.status(404).json({
          error: {
            code: "NO_TOPICS",
            message: "No topics found for this category.",
          },
        });
        return;
      }

      const histFilter: Record<string, unknown> = { userId };
      if (category && typeof category === "string") {
        histFilter.category = category;
      }
      const history = await TopicHistory.find(histFilter)
        .select("topicId")
        .lean();
      const attemptedIds = new Set(history.map((h) => h.topicId.toString()));

      const unattempted = allTopics.filter(
        (t) => !attemptedIds.has(t._id.toString())
      );

      if (unattempted.length === 0) {
        res.status(200).json({
          exhausted: true,
          message: category
            ? `You have attempted all available topics in the "${category}" category. Explore another category or retry previous topics!`
            : "You have attempted all available extempore topics. Outstanding spontaneous speaking practice!",
          totalAttempted: attemptedIds.size,
          totalAvailable: allTopics.length,
        });
        return;
      }

      // Pick a random unattempted topic
      const topic = unattempted[Math.floor(Math.random() * unattempted.length)];
      res.status(200).json({ topic });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/topics/categories
 * Returns all 4 categories with total and attempted counts for the current user.
 */
topicRouter.get(
  "/categories",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const categories: TopicCategory[] = [
        "general",
        "academic",
        "social",
        "professional",
      ];

      const results = await Promise.all(
        categories.map(async (cat) => {
          const total = await Topic.countDocuments({
            category: cat,
            isActive: true,
          });
          const attempted = await TopicHistory.countDocuments({
            userId,
            category: cat,
          });
          return {
            category: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            total,
            attempted,
            remaining: Math.max(0, total - attempted),
          };
        })
      );

      res.status(200).json({ categories: results });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/topics/history
 */
topicRouter.get(
  "/history",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { category, limit } = req.query;
      const pageLimit = Math.min(Number(limit) || 20, 100);

      const filter: Record<string, unknown> = { userId };
      if (category && typeof category === "string") {
        filter.category = category;
      }

      const history = await TopicHistory.find(filter)
        .sort({ attemptedAt: -1 })
        .limit(pageLimit)
        .populate("topicId", "text category difficulty tags")
        .lean();

      res.status(200).json({ history });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/topics/history
 * Records that the authenticated user attempted a topic.
 */
topicRouter.post(
  "/history",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { topicId, category, sessionId } = req.body;

      if (!topicId || !category) {
        res.status(400).json({
          error: {
            code: "MISSING_FIELDS",
            message: "topicId and category are required.",
          },
        });
        return;
      }

      const existing = await TopicHistory.findOne({ userId, topicId });
      if (existing) {
        res.status(200).json({ history: existing, created: false });
        return;
      }

      const entry = await TopicHistory.create({
        userId,
        topicId: new Types.ObjectId(topicId),
        category,
        sessionId: sessionId ? new Types.ObjectId(sessionId) : undefined,
        attemptedAt: new Date(),
      });

      res.status(201).json({ history: entry, created: true });
    } catch (err) {
      next(err);
    }
  }
);
