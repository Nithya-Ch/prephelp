import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { Question } from "../models/question-bank.model.js";
import { QuestionHistory } from "../models/question-history.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { Types } from "mongoose";

export const questionRouter = Router();

/**
 * GET /api/questions/next
 * Returns the next unattempted question for the authenticated user.
 * Query params:
 *   category?: SituationalCategory  — filter to a specific category
 * Response:
 *   { question } | { exhausted: true, message }
 */
questionRouter.get(
  "/next",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { category } = req.query;

      // Build filter
      const filter: Record<string, unknown> = { isActive: true };
      if (category && typeof category === "string") {
        filter.category = category;
      }

      // Get all matching questions
      const allQuestions = await Question.find(filter).lean();

      if (allQuestions.length === 0) {
        res.status(404).json({
          error: {
            code: "NO_QUESTIONS",
            message: "No questions found for this category.",
          },
        });
        return;
      }

      // Get IDs the user has already attempted
      const histFilter: Record<string, unknown> = { userId };
      if (category && typeof category === "string") {
        histFilter.category = category;
      }
      const history = await QuestionHistory.find(histFilter)
        .select("questionId")
        .lean();
      const attemptedIds = new Set(
        history.map((h) => h.questionId.toString())
      );

      // Filter out already-attempted questions
      const unattempted = allQuestions.filter(
        (q) => !attemptedIds.has(q._id.toString())
      );

      if (unattempted.length === 0) {
        // All questions in this category have been attempted
        res.status(200).json({
          exhausted: true,
          message:
            category
              ? `You have attempted all available questions in the "${category}" category. Try a different category or revisit your previous answers.`
              : "You have attempted all available situational questions. Great work!",
          totalAttempted: attemptedIds.size,
          totalAvailable: allQuestions.length,
        });
        return;
      }

      // Pick a random unattempted question (simple but fair selection)
      const question =
        unattempted[Math.floor(Math.random() * unattempted.length)];

      res.status(200).json({ question });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/questions/categories
 * Returns all categories with their total question count and how many
 * the authenticated user has already attempted.
 */
questionRouter.get(
  "/categories",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);

      const categories = [
        "teamwork",
        "conflict-resolution",
        "leadership",
        "decision-making",
        "workplace-ethics",
        "problem-solving",
      ] as const;

      const results = await Promise.all(
        categories.map(async (cat) => {
          const total = await Question.countDocuments({
            category: cat,
            isActive: true,
          });
          const attempted = await QuestionHistory.countDocuments({
            userId,
            category: cat,
          });
          return {
            category: cat,
            label: cat
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
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
 * GET /api/questions/history
 * Returns the authenticated user's question attempt history.
 * Query params:
 *   category?: string
 *   limit?: number (default 20)
 */
questionRouter.get(
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

      const history = await QuestionHistory.find(filter)
        .sort({ attemptedAt: -1 })
        .limit(pageLimit)
        .populate("questionId", "text category difficulty")
        .lean();

      res.status(200).json({ history });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/questions/history
 * Records that the authenticated user has attempted a question.
 * Body: { questionId, category, sessionId? }
 */
questionRouter.post(
  "/history",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { questionId, category, sessionId } = req.body;

      if (!questionId || !category) {
        res.status(400).json({
          error: {
            code: "MISSING_FIELDS",
            message: "questionId and category are required.",
          },
        });
        return;
      }

      // Idempotent: don't create a duplicate history entry for the same question
      const existing = await QuestionHistory.findOne({ userId, questionId });
      if (existing) {
        res.status(200).json({ history: existing, created: false });
        return;
      }

      const entry = await QuestionHistory.create({
        userId,
        questionId,
        category,
        sessionId: sessionId || undefined,
        attemptedAt: new Date(),
      });

      res.status(201).json({ history: entry, created: true });
    } catch (err) {
      next(err);
    }
  }
);
