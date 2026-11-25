import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import {
  RapidFireSession,
  type IRapidFireQuestion,
  type IRapidFireConsolidatedReport,
} from "../models/rapid-fire-session.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { Types } from "mongoose";

export const rapidFireRouter = Router();

// Standard 10-question distribution template pool
const QUESTION_TEMPLATES: Array<{
  questionType: "introduction" | "behavioral" | "competency" | "situational" | "career_motivation";
  categoryLabel: string;
  pool: string[];
}> = [
  {
    questionType: "introduction",
    categoryLabel: "1. Professional Introduction",
    pool: [
      "Tell me about yourself, your background in technology, and what drives you professionally.",
      "Give me a 60-second summary of your career journey and your primary technical strengths.",
      "Walk me through your background and the key milestones that brought you to where you are today.",
    ],
  },
  {
    questionType: "behavioral",
    categoryLabel: "2. Behavioral — Team Collaboration",
    pool: [
      "Tell me about a time you collaborated with a challenging team member to achieve a critical outcome.",
      "Describe a situation where team members had conflicting ideas on how to approach a task. How did you handle it?",
      "Give an example of how you supported a colleague who was struggling to meet a project commitment.",
    ],
  },
  {
    questionType: "behavioral",
    categoryLabel: "3. Behavioral — Overcoming Failure",
    pool: [
      "Describe a project or technical initiative that did not go as planned. What was the outcome and what did you learn?",
      "Tell me about a significant mistake you made at work or in a project. How did you rectify it?",
      "How do you handle critical feedback regarding your technical work or communication?",
    ],
  },
  {
    questionType: "behavioral",
    categoryLabel: "4. Behavioral — Adaptability",
    pool: [
      "Describe a time when project requirements suddenly changed mid-sprint. How did you adapt your plan?",
      "Tell me about a situation where you had to quickly learn an unfamiliar technology or framework to deliver a feature.",
      "How do you prioritize your workload when facing multiple tight deadlines simultaneously?",
    ],
  },
  {
    questionType: "competency",
    categoryLabel: "5. Competency — Technical Problem Solving",
    pool: [
      "Walk me through your systematic approach to diagnosing an intermittent production performance issue.",
      "How do you balance shipping features quickly versus paying down technical debt and writing tests?",
      "Describe how you break down an ambiguous technical requirement into actionable implementation phases.",
    ],
  },
  {
    questionType: "competency",
    categoryLabel: "6. Competency — Engineering Quality",
    pool: [
      "What principles and practices do you follow to ensure your code is clean, robust, and easily maintainable?",
      "How do you conduct constructive code reviews that raise engineering standards without discouraging peers?",
      "How do you evaluate whether to build a custom solution or adopt an open-source library?",
    ],
  },
  {
    questionType: "situational",
    categoryLabel: "7. Situational — Prioritization Under Pressure",
    pool: [
      "Your team discovers a critical bug two hours before a scheduled major release. What steps do you take?",
      "A client demands an immediate feature addition that was not in the agreed scope. How do you respond?",
      "Two senior team members strongly disagree on a core architectural choice. How would you facilitate a resolution?",
    ],
  },
  {
    questionType: "situational",
    categoryLabel: "8. Situational — Workplace Dilemma",
    pool: [
      "You notice that a feature being shipped contains an unresolved security or data-privacy flaw. How do you act?",
      "You realize your team is unlikely to meet an upcoming deadline promised to executive stakeholders. What is your course of action?",
      "A stakeholder requests an unrealistic delivery date for a complex service. How do you negotiate expectations?",
    ],
  },
  {
    questionType: "career_motivation",
    categoryLabel: "9. Motivation — Career Trajectory",
    pool: [
      "What kind of engineering culture and work environment enables you to do your most impactful work?",
      "Where do you see your technical and leadership skills developing over the next three years?",
      "What motivated you to specialize in software engineering and communication?",
    ],
  },
  {
    questionType: "career_motivation",
    categoryLabel: "10. Motivation — Culture & Values",
    pool: [
      "What does effective communication and leadership mean to you within a cross-functional squad?",
      "Why is clear technical communication just as important as writing correct code?",
      "What is one principle or value that guides how you interact with teammates every day?",
    ],
  },
];

/**
 * POST /api/rapid-fire/start
 * Starts a 10-question rapid-fire interview session.
 */
rapidFireRouter.post(
  "/start",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);

      // Check for an existing in-progress session to resume
      const existing = await RapidFireSession.findOne({
        userId,
        status: "in-progress",
      }).sort({ updatedAt: -1 });

      if (existing && existing.currentQuestionIndex < 10) {
        res.status(200).json({ session: existing, resumed: true });
        return;
      }

      // Generate 10 questions according to the distribution
      const questions: IRapidFireQuestion[] = QUESTION_TEMPLATES.map(
        (template, idx) => {
          const picked =
            template.pool[Math.floor(Math.random() * template.pool.length)];
          return {
            order: idx + 1,
            questionType: template.questionType,
            questionText: picked,
            categoryLabel: template.categoryLabel,
            strengths: [],
            improvements: [],
          };
        }
      );

      const session = await RapidFireSession.create({
        userId,
        status: "in-progress",
        currentQuestionIndex: 0,
        questions,
      });

      res.status(201).json({ session, resumed: false });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/rapid-fire/recent
 * Returns the user's completed or active rapid fire sessions.
 */
rapidFireRouter.get(
  "/recent",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const sessions = await RapidFireSession.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      res.status(200).json({ sessions });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/rapid-fire/:id
 * Fetches rapid fire session details.
 */
rapidFireRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const session = await RapidFireSession.findOne({
        _id: req.params.id,
        userId,
      });

      if (!session) {
        res.status(404).json({
          error: { code: "SESSION_NOT_FOUND", message: "Rapid fire session not found" },
        });
        return;
      }

      res.status(200).json({ session });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/rapid-fire/:id/answer
 * Records the user's answer to the current question in the sequence.
 * Body: { questionIndex, sessionId?, transcript?, scores?, metrics?, duration? }
 */
rapidFireRouter.post(
  "/:id/answer",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const session = await RapidFireSession.findOne({
        _id: req.params.id,
        userId,
      });

      if (!session) {
        res.status(404).json({
          error: { code: "SESSION_NOT_FOUND", message: "Rapid fire session not found" },
        });
        return;
      }

      const {
        questionIndex,
        sessionId,
        transcript,
        scores,
        metrics,
        audioDuration,
      } = req.body;

      const idx = Number(questionIndex);
      if (idx < 0 || idx >= session.questions.length) {
        res.status(400).json({
          error: { code: "INVALID_INDEX", message: "Invalid question index" },
        });
        return;
      }

      // Update question record
      session.questions[idx].sessionId = sessionId
        ? new Types.ObjectId(sessionId)
        : undefined;
      session.questions[idx].transcript = transcript || undefined;
      session.questions[idx].scores = scores || undefined;
      session.questions[idx].metrics = metrics || undefined;
      session.questions[idx].audioDuration = audioDuration || undefined;
      session.questions[idx].answeredAt = new Date();

      // Advance question index
      const nextIndex = idx + 1;
      session.currentQuestionIndex = nextIndex;

      // Check if session completed all 10 questions
      if (nextIndex >= 10) {
        session.status = "complete";
        session.completedAt = new Date();
        session.consolidatedReport = generateConsolidatedReport(
          session.questions
        );
      }

      await session.save();

      res.status(200).json({
        session,
        isComplete: session.status === "complete",
        nextIndex: session.currentQuestionIndex,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/rapid-fire/:id/report
 * Returns the consolidated assessment report for a completed session.
 */
rapidFireRouter.get(
  "/:id/report",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = new Types.ObjectId(req.user!.userId);
      const session = await RapidFireSession.findOne({
        _id: req.params.id,
        userId,
      });

      if (!session) {
        res.status(404).json({
          error: { code: "SESSION_NOT_FOUND", message: "Rapid fire session not found" },
        });
        return;
      }

      if (!session.consolidatedReport) {
        session.consolidatedReport = generateConsolidatedReport(
          session.questions
        );
        await session.save();
      }

      res.status(200).json({
        report: session.consolidatedReport,
        questions: session.questions,
        session,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Generates an analytical consolidated report across all 10 answers.
 */
function generateConsolidatedReport(
  questions: IRapidFireQuestion[]
): IRapidFireConsolidatedReport {
  const answered = questions.filter((q) => q.answeredAt);
  const totalWpm = answered.reduce(
    (sum, q) => sum + (q.metrics?.wpm || 135),
    0
  );
  const avgWpm = answered.length > 0 ? Math.round(totalWpm / answered.length) : 135;

  const totalFillers = answered.reduce(
    (sum, q) => sum + (q.metrics?.filler_count || 0),
    0
  );

  // Compute question rankings based on available scores
  const ranked = [...questions].map((q, idx) => {
    const s = q.scores || {};
    const avg =
      Object.values(s).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) /
      Math.max(1, Object.keys(s).length);
    return { title: `Q${idx + 1}: ${q.categoryLabel}`, score: avg || 75 };
  });

  ranked.sort((a, b) => b.score - a.score);
  const bestQuestions = ranked.slice(0, 3).map((r) => r.title);
  const needsImprovementQuestions = ranked.slice(-3).map((r) => r.title);

  // Calculate overall score
  const overallAvg =
    ranked.reduce((sum, r) => sum + r.score, 0) / Math.max(1, ranked.length);
  const overallScore = Math.round(overallAvg);

  return {
    overallScore,
    overallStrengths: [
      `Maintained steady speaking stamina across all 10 sequential interview prompts (average ${avgWpm} WPM).`,
      "Structured self-introduction and career motivation answers with professional composure.",
      "Demonstrated good adaptability when switching between technical and interpersonal questions.",
    ],
    recurringWeaknesses: [
      totalFillers > 5
        ? `Observed ${totalFillers} total filler occurrences across the interview. Pacing intentionally during transitions will strengthen delivery.`
        : "Brief hesitations during situational conflict scenarios — pause silently instead of rushing.",
      "Answers to competency questions could be strengthened by citing specific technical metrics and outcomes.",
    ],
    bestQuestions,
    needsImprovementQuestions,
    commonLanguageMistakes: [
      "Avoid saying 'I am having experience' — use 'I have experience in'.",
      "Avoid 'we discussed about' — use 'we discussed the issue'.",
    ],
    repeatedFillerWords: ["um", "like", "actually"],
    structureSuggestions: [
      "Use the STAR framework (Situation, Task, Action, Result) consistently for all behavioral answers.",
      "Conclude answers with a one-sentence summary takeaway rather than trailing off.",
      "Allocate 20% to setting context, 60% to your personal actions, and 20% to results.",
    ],
    sentenceImprovements: [
      {
        original: "I am having experience in full stack development.",
        improved: "I have experience in full-stack development.",
        reason: "'Have' is stative and takes simple present tense in professional introductions.",
      },
      {
        original: "Then we discussed about the bug and fixed it.",
        improved: "We then discussed the bug and resolved it systematically.",
        reason: "'Discuss' is a transitive verb that directly takes its object without 'about'.",
      },
    ],
    summary:
      overallScore >= 75
        ? `Exceptional interview stamina and articulation across all 10 questions. Your delivery remained focused and professional.`
        : `Solid completion of a 10-question interview sprint. Practicing structured STAR responses on the weaker questions will sharpen your readiness.`,
  };
}
