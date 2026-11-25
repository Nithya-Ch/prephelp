import { Router, type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { Exercise } from "../models/exercise.model.js";

export const exerciseRouter = Router();

// Standard defaults across all 6 exercises to seed on-demand if database is empty or missing a type
const ALL_DEFAULTS = [
  // ── Professional Introduction ──
  {
    type: "professional-introduction",
    prompt:
      "Introduce yourself in 60–90 seconds. Include your name, educational background, one key strength, and what you are looking for in your next role.",
    targetSkills: ["grammar", "structure", "clarity", "professional-tone"],
    difficulty: 25,
    timeLimitSec: 90,
    prepTimeSec: 20,
    tags: ["introduction", "placement", "beginner", "professional-introduction"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "professional-introduction",
    prompt:
      "Give a 90-second professional introduction that covers your background, a specific project or achievement you are proud of, your core technical or domain strengths, and your immediate career goal.",
    targetSkills: ["grammar", "vocabulary", "structure", "confidence", "professional-tone"],
    difficulty: 50,
    timeLimitSec: 120,
    prepTimeSec: 30,
    tags: ["introduction", "placement", "intermediate", "professional-introduction"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "professional-introduction",
    prompt:
      "Deliver a 2-minute executive-level professional introduction: cover your name, years of experience, a quantified achievement, a leadership or cross-functional contribution, and how your skills align with an engineering-driven organisation.",
    targetSkills: ["grammar", "vocabulary", "structure", "confidence", "fluency", "professional-tone"],
    difficulty: 75,
    timeLimitSec: 150,
    prepTimeSec: 45,
    tags: ["introduction", "placement", "advanced", "professional-introduction"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  // ── Read Aloud ──
  {
    type: "read-aloud",
    prompt:
      "Read the foundational technical passage aloud clearly, paying attention to pronunciation, natural cadence, and punctuation pauses.",
    referenceText:
      "Microservices architecture structures an application as a collection of loosely coupled, independently deployable services. Each service communicates through well-defined APIs and can be maintained by specialized engineering teams.",
    targetSkills: ["pronunciation", "pacing", "fluency"],
    difficulty: 30,
    timeLimitSec: 60,
    prepTimeSec: 15,
    tags: ["read-aloud", "technical", "beginner", "ra-beginner"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "read-aloud",
    prompt:
      "Read the cognitive science passage aloud with steady cadence, measured inflection, and clear articulation.",
    referenceText:
      "Cognitive architecture theory suggests working memory capacity is strictly constrained during high-stakes verbal retrieval. By pacing vocal inflection deliberately, communicators preserve attentional bandwidth.",
    targetSkills: ["articulation", "cadence", "fluency"],
    difficulty: 50,
    timeLimitSec: 75,
    prepTimeSec: 20,
    tags: ["read-aloud", "cognitive", "intermediate", "ra-intermediate", "read-aloud-scientific"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "read-aloud",
    prompt:
      "Read the client escalation advisory aloud with appropriate composure, cadence, and clear articulation.",
    referenceText:
      "We acknowledge the discrepancy observed during the cloud data synchronization cycle. Our incident response team has isolated the intermittent network partition, rolled out an immutable hotfix, and initiated comprehensive integrity audits across all tenant namespaces.",
    targetSkills: ["articulation", "steadiness", "fluency"],
    difficulty: 75,
    timeLimitSec: 90,
    prepTimeSec: 30,
    tags: ["read-aloud", "incident-response", "advanced", "ra-advanced"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  // ── Situational Template ──
  {
    type: "situational",
    prompt: "Situational-Based Workplace Scenario",
    targetSkills: ["reasoning", "communication", "structure", "relevance"],
    difficulty: 55,
    timeLimitSec: 150,
    prepTimeSec: 20,
    tags: ["situational", "workplace", "general"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  // ── Extempore Template ──
  {
    type: "extempore",
    prompt: "Extempore Speaking Prompt",
    targetSkills: ["spontaneous-speaking", "structure", "fluency", "depth"],
    difficulty: 60,
    timeLimitSec: 120,
    prepTimeSec: 30,
    tags: ["extempore", "spontaneous", "public-speaking"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  // ── Pronunciation Template ──
  {
    type: "pronunciation",
    prompt: "Word-Level Pronunciation Practice",
    targetSkills: ["articulation", "enunciation", "phonetic-accuracy"],
    difficulty: 40,
    timeLimitSec: 15,
    prepTimeSec: 5,
    tags: ["pronunciation", "word-level"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  // ── Rapid Fire Template ──
  {
    type: "rapid-fire",
    prompt: "Interview Rapid Fire Session (10 Questions)",
    targetSkills: ["stamina", "consistency", "structure", "versatility"],
    difficulty: 70,
    timeLimitSec: 90,
    prepTimeSec: 15,
    tags: ["rapid-fire", "interview", "comprehensive"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
];

exerciseRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, targetSkills, minDifficulty, maxDifficulty } = req.query;

      const filter: Record<string, unknown> = {
        isActive: true,
      };

      if (type && typeof type === "string") {
        filter.type = type;
      }

      if (targetSkills && typeof targetSkills === "string") {
        const skillsArray = targetSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (skillsArray.length > 0) {
          filter.targetSkills = { $in: skillsArray };
        }
      }

      if (minDifficulty !== undefined || maxDifficulty !== undefined) {
        const difficultyFilter: Record<string, number> = {};
        if (minDifficulty !== undefined) {
          const min = Number(minDifficulty);
          if (!isNaN(min)) difficultyFilter.$gte = min;
        }
        if (maxDifficulty !== undefined) {
          const max = Number(maxDifficulty);
          if (!isNaN(max)) difficultyFilter.$lte = max;
        }
        if (Object.keys(difficultyFilter).length > 0) {
          filter.difficulty = difficultyFilter;
        }
      }

      let exercises = await Exercise.find(filter).sort({ difficulty: 1 });

      // Auto-populate missing exercises on demand so no exercise type ever returns empty
      if (exercises.length === 0) {
        const targetType = type && typeof type === "string" ? type : null;
        const toInsert = targetType
          ? ALL_DEFAULTS.filter((d) => d.type === targetType)
          : ALL_DEFAULTS;

        if (toInsert.length > 0) {
          await Exercise.create(toInsert);
          exercises = await Exercise.find(filter).sort({ difficulty: 1 });
        }
      }

      res.status(200).json({ exercises });
    } catch (err) {
      next(err);
    }
  }
);

exerciseRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      let exercise: any = null;
      if (Types.ObjectId.isValid(exerciseId)) {
        exercise = await Exercise.findById(exerciseId);
      }

      if (!exercise) {
        // Fallback by slug/tag
        exercise = await Exercise.findOne({
          $or: [
            { type: exerciseId },
            { tags: exerciseId },
          ],
        });
      }

      if (!exercise) {
        // Match default template
        const match = ALL_DEFAULTS.find(
          (d) => d.type === exerciseId || d.tags.includes(exerciseId)
        );
        if (match) {
          exercise = await Exercise.create(match);
        }
      }

      if (!exercise) {
        res.status(404).json({
          error: {
            code: "EXERCISE_NOT_FOUND",
            message: "Exercise not found",
          },
        });
        return;
      }

      res.status(200).json(exercise);
    } catch (err) {
      next(err);
    }
  }
);
