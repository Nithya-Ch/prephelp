import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { Word, type WordDifficulty } from "../models/word-bank.model.js";
import { WordHistory } from "../models/word-history.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { Types } from "mongoose";

export const wordRouter = Router();

/**
 * GET /api/words/next
 * Returns the next word to practice for the given difficulty.
 * Query params:
 *   difficulty?: "beginner" | "intermediate" | "advanced"
 */
wordRouter.get(
  "/next",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { difficulty } = req.query;

      const filter: Record<string, unknown> = { isActive: true };
      if (
        difficulty &&
        ["beginner", "intermediate", "advanced"].includes(difficulty as string)
      ) {
        filter.difficulty = difficulty;
      }

      const allWords = await Word.find(filter).lean();
      if (allWords.length === 0) {
        res.status(404).json({
          error: {
            code: "NO_WORDS",
            message: "No words found for this difficulty.",
          },
        });
        return;
      }

      // Find words successfully recognized vs needs practice
      const userHistory = await WordHistory.find({ userId }).lean();
      const recognizedIds = new Set(
        userHistory
          .filter((h) => h.recognized)
          .map((h) => h.wordId.toString())
      );

      // Prioritize unattempted or unrecognized words
      const unmastered = allWords.filter(
        (w) => !recognizedIds.has(w._id.toString())
      );

      const targetPool = unmastered.length > 0 ? unmastered : allWords;
      const selected =
        targetPool[Math.floor(Math.random() * targetPool.length)];

      res.status(200).json({
        word: selected,
        allMastered: unmastered.length === 0,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/words/attempt
 * Records a pronunciation attempt.
 * Body: { wordId, recognized, transcribedText }
 */
wordRouter.post(
  "/attempt",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const { wordId, recognized, transcribedText } = req.body;

      if (!wordId || typeof recognized !== "boolean") {
        res.status(400).json({
          error: {
            code: "MISSING_FIELDS",
            message: "wordId and recognized boolean are required.",
          },
        });
        return;
      }

      const wordDoc = await Word.findById(wordId);
      if (!wordDoc) {
        res.status(404).json({
          error: { code: "WORD_NOT_FOUND", message: "Word not found" },
        });
        return;
      }

      const history = await WordHistory.findOneAndUpdate(
        { userId, wordId: wordDoc._id },
        {
          $set: {
            wordText: wordDoc.word,
            difficulty: wordDoc.difficulty,
            recognized,
            transcribedText: transcribedText || undefined,
            lastAttemptedAt: new Date(),
          },
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true }
      );

      res.status(200).json({ history });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/words/progress
 * Returns the user's pronunciation mastery statistics.
 */
wordRouter.get(
  "/progress",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const difficulties: WordDifficulty[] = [
        "beginner",
        "intermediate",
        "advanced",
      ];

      const stats = await Promise.all(
        difficulties.map(async (diff) => {
          const totalWords = await Word.countDocuments({
            difficulty: diff,
            isActive: true,
          });
          const attempts = await WordHistory.find({
            userId,
            difficulty: diff,
          }).lean();

          const attemptedCount = attempts.length;
          const recognizedCount = attempts.filter((a) => a.recognized).length;
          const accuracy =
            attemptedCount > 0
              ? Math.round((recognizedCount / attemptedCount) * 100)
              : 0;

          return {
            difficulty: diff,
            totalWords,
            attemptedCount,
            recognizedCount,
            accuracy,
          };
        })
      );

      res.status(200).json({ stats });
    } catch (err) {
      next(err);
    }
  }
);
