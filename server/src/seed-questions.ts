import mongoose from "mongoose";
import { config } from "./config.js";
import { Question, type SituationalCategory } from "./models/question-bank.model.js";

interface SeedQuestion {
  category: SituationalCategory;
  text: string;
  difficulty: number;
  targetSkills: string[];
  tags: string[];
  isActive: boolean;
  source: "seed";
}

const questions: SeedQuestion[] = [
  // ── TEAMWORK (7 questions) ──────────────────────────────────
  {
    category: "teamwork",
    text: "Tell me about a time you worked in a team where members had very different working styles. How did you adapt?",
    difficulty: 40,
    targetSkills: ["empathy", "adaptability", "communication"],
    tags: ["collaboration", "diversity", "beginner"],
    isActive: true,
    source: "seed",
  },
  {
    category: "teamwork",
    text: "Describe a situation where your team missed a deadline. What was your role, and what did you learn from it?",
    difficulty: 55,
    targetSkills: ["accountability", "reflection", "structure"],
    tags: ["deadline", "responsibility", "learning"],
    isActive: true,
    source: "seed",
  },
  {
    category: "teamwork",
    text: "Give an example of a time you helped a struggling teammate without being asked. What motivated you?",
    difficulty: 45,
    targetSkills: ["empathy", "proactivity", "communication"],
    tags: ["support", "initiative", "kindness"],
    isActive: true,
    source: "seed",
  },
  {
    category: "teamwork",
    text: "Describe a project where the team had conflicting priorities. How did you help reach alignment?",
    difficulty: 65,
    targetSkills: ["leadership", "negotiation", "clarity"],
    tags: ["alignment", "priorities", "intermediate"],
    isActive: true,
    source: "seed",
  },
  {
    category: "teamwork",
    text: "Tell me about a cross-functional project you contributed to. What challenges arose from working with different departments?",
    difficulty: 60,
    targetSkills: ["collaboration", "communication", "adaptability"],
    tags: ["cross-functional", "coordination"],
    isActive: true,
    source: "seed",
  },
  {
    category: "teamwork",
    text: "Have you ever disagreed with the direction the team was taking? How did you handle it while still being a team player?",
    difficulty: 70,
    targetSkills: ["diplomacy", "structure", "confidence"],
    tags: ["disagreement", "constructive-dissent"],
    isActive: true,
    source: "seed",
  },
  {
    category: "teamwork",
    text: "Describe how you have handled remote collaboration challenges such as time zones, communication gaps, or misaligned expectations.",
    difficulty: 65,
    targetSkills: ["communication", "adaptability", "organisation"],
    tags: ["remote-work", "async", "collaboration"],
    isActive: true,
    source: "seed",
  },

  // ── CONFLICT RESOLUTION (7 questions) ──────────────────────
  {
    category: "conflict-resolution",
    text: "Tell me about a time you had a serious disagreement with a colleague. How did you approach the conversation?",
    difficulty: 50,
    targetSkills: ["empathy", "communication", "structure"],
    tags: ["disagreement", "interpersonal", "beginner"],
    isActive: true,
    source: "seed",
  },
  {
    category: "conflict-resolution",
    text: "Describe a situation where you had to deliver critical feedback to someone senior. How did you frame it?",
    difficulty: 70,
    targetSkills: ["diplomacy", "confidence", "clarity"],
    tags: ["upward-feedback", "communication"],
    isActive: true,
    source: "seed",
  },
  {
    category: "conflict-resolution",
    text: "Have you ever been in a situation where two team members were in conflict with each other? How did you help resolve it?",
    difficulty: 65,
    targetSkills: ["mediation", "empathy", "leadership"],
    tags: ["mediation", "interpersonal"],
    isActive: true,
    source: "seed",
  },
  {
    category: "conflict-resolution",
    text: "Tell me about a time a client or stakeholder was dissatisfied with your work. How did you handle the situation?",
    difficulty: 60,
    targetSkills: ["empathy", "accountability", "communication"],
    tags: ["client-management", "feedback"],
    isActive: true,
    source: "seed",
  },
  {
    category: "conflict-resolution",
    text: "Describe a time when you had to maintain your position under pressure while remaining respectful.",
    difficulty: 70,
    targetSkills: ["confidence", "diplomacy", "reasoning"],
    tags: ["assertiveness", "pressure"],
    isActive: true,
    source: "seed",
  },
  {
    category: "conflict-resolution",
    text: "Tell me about a time when a miscommunication led to a problem. What did you do to fix it and prevent recurrence?",
    difficulty: 50,
    targetSkills: ["accountability", "clarity", "structure"],
    tags: ["miscommunication", "process"],
    isActive: true,
    source: "seed",
  },
  {
    category: "conflict-resolution",
    text: "Have you ever had to tell someone their idea was not going to work? How did you approach that conversation?",
    difficulty: 65,
    targetSkills: ["empathy", "clarity", "diplomacy"],
    tags: ["honest-feedback", "communication"],
    isActive: true,
    source: "seed",
  },

  // ── LEADERSHIP (6 questions) ────────────────────────────────
  {
    category: "leadership",
    text: "Describe a situation where you had to lead a team without formal authority. How did you gain buy-in?",
    difficulty: 65,
    targetSkills: ["influence", "communication", "confidence"],
    tags: ["informal-leadership", "influence"],
    isActive: true,
    source: "seed",
  },
  {
    category: "leadership",
    text: "Tell me about a time you had to make an unpopular decision as a team lead. How did you communicate it?",
    difficulty: 75,
    targetSkills: ["decisiveness", "transparency", "structure"],
    tags: ["decision-making", "leadership"],
    isActive: true,
    source: "seed",
  },
  {
    category: "leadership",
    text: "Give an example of how you have motivated a team member who was disengaged or underperforming.",
    difficulty: 70,
    targetSkills: ["empathy", "coaching", "communication"],
    tags: ["motivation", "people-management"],
    isActive: true,
    source: "seed",
  },
  {
    category: "leadership",
    text: "Describe a time you had to delegate an important task. How did you decide who to give it to, and how did you follow up?",
    difficulty: 60,
    targetSkills: ["delegation", "trust", "structure"],
    tags: ["delegation", "trust"],
    isActive: true,
    source: "seed",
  },
  {
    category: "leadership",
    text: "Tell me about a moment when you identified a gap in your team's process and took initiative to fix it.",
    difficulty: 55,
    targetSkills: ["initiative", "structure", "communication"],
    tags: ["process-improvement", "proactivity"],
    isActive: true,
    source: "seed",
  },
  {
    category: "leadership",
    text: "Describe how you have handled a situation where your team had low morale during a difficult project.",
    difficulty: 70,
    targetSkills: ["empathy", "motivation", "leadership"],
    tags: ["morale", "resilience", "team-health"],
    isActive: true,
    source: "seed",
  },

  // ── DECISION-MAKING (6 questions) ──────────────────────────
  {
    category: "decision-making",
    text: "Describe a high-stakes decision you had to make with limited information. How did you approach it?",
    difficulty: 70,
    targetSkills: ["reasoning", "confidence", "structure"],
    tags: ["ambiguity", "risk", "intermediate"],
    isActive: true,
    source: "seed",
  },
  {
    category: "decision-making",
    text: "Tell me about a time you chose a less popular option because you believed it was the right one. What was the outcome?",
    difficulty: 65,
    targetSkills: ["confidence", "reasoning", "communication"],
    tags: ["independent-thinking", "conviction"],
    isActive: true,
    source: "seed",
  },
  {
    category: "decision-making",
    text: "Give an example of a time you had to quickly evaluate two or more competing options. How did you decide?",
    difficulty: 55,
    targetSkills: ["analytical-thinking", "clarity", "structure"],
    tags: ["trade-offs", "evaluation"],
    isActive: true,
    source: "seed",
  },
  {
    category: "decision-making",
    text: "Describe a time you made a wrong decision. How did you recognise it, and what did you do?",
    difficulty: 60,
    targetSkills: ["accountability", "reflection", "resilience"],
    tags: ["mistakes", "learning", "accountability"],
    isActive: true,
    source: "seed",
  },
  {
    category: "decision-making",
    text: "Have you ever had to revisit and reverse a decision you had already communicated? How did you handle it?",
    difficulty: 75,
    targetSkills: ["transparency", "confidence", "communication"],
    tags: ["course-correction", "communication"],
    isActive: true,
    source: "seed",
  },
  {
    category: "decision-making",
    text: "Tell me about a situation where data and intuition pointed in different directions. How did you resolve the conflict?",
    difficulty: 80,
    targetSkills: ["analytical-thinking", "reasoning", "confidence"],
    tags: ["data-driven", "intuition", "advanced"],
    isActive: true,
    source: "seed",
  },

  // ── WORKPLACE ETHICS (7 questions) ─────────────────────────
  {
    category: "workplace-ethics",
    text: "Tell me about a time you witnessed something at work that you felt was unfair or unethical. What did you do?",
    difficulty: 65,
    targetSkills: ["integrity", "confidence", "communication"],
    tags: ["ethics", "integrity", "speaking-up"],
    isActive: true,
    source: "seed",
  },
  {
    category: "workplace-ethics",
    text: "Describe a situation where you were asked to do something that made you uncomfortable from a professional or ethical standpoint.",
    difficulty: 70,
    targetSkills: ["integrity", "assertiveness", "communication"],
    tags: ["boundaries", "ethics"],
    isActive: true,
    source: "seed",
  },
  {
    category: "workplace-ethics",
    text: "Have you ever found yourself in a situation where the right thing to do was not the easiest thing to do? What happened?",
    difficulty: 60,
    targetSkills: ["integrity", "reasoning", "confidence"],
    tags: ["ethics", "honesty"],
    isActive: true,
    source: "seed",
  },
  {
    category: "workplace-ethics",
    text: "Tell me about a time you had to maintain confidentiality under pressure. How did you handle it?",
    difficulty: 65,
    targetSkills: ["integrity", "discretion", "communication"],
    tags: ["confidentiality", "trust"],
    isActive: true,
    source: "seed",
  },
  {
    category: "workplace-ethics",
    text: "Describe a situation where you noticed a colleague taking credit for someone else's work. What did you do?",
    difficulty: 70,
    targetSkills: ["integrity", "empathy", "communication"],
    tags: ["fairness", "advocacy"],
    isActive: true,
    source: "seed",
  },
  {
    category: "workplace-ethics",
    text: "Have you ever had to report a colleague's inappropriate behavior? How did you approach it?",
    difficulty: 75,
    targetSkills: ["integrity", "confidence", "communication"],
    tags: ["reporting", "accountability", "difficult-conversations"],
    isActive: true,
    source: "seed",
  },
  {
    category: "workplace-ethics",
    text: "Describe a time when you had competing loyalties — to your team, your manager, or company policy. How did you navigate it?",
    difficulty: 80,
    targetSkills: ["integrity", "reasoning", "structure"],
    tags: ["competing-loyalties", "ethics", "advanced"],
    isActive: true,
    source: "seed",
  },

  // ── PROBLEM-SOLVING (7 questions) ──────────────────────────
  {
    category: "problem-solving",
    text: "Tell me about a complex problem you solved at work or in a project. Walk me through your approach.",
    difficulty: 55,
    targetSkills: ["analytical-thinking", "structure", "clarity"],
    tags: ["problem-solving", "methodology", "beginner"],
    isActive: true,
    source: "seed",
  },
  {
    category: "problem-solving",
    text: "Describe a time you had to solve a problem with very limited resources. What did you do?",
    difficulty: 65,
    targetSkills: ["creativity", "resourcefulness", "reasoning"],
    tags: ["constraints", "resourcefulness"],
    isActive: true,
    source: "seed",
  },
  {
    category: "problem-solving",
    text: "Have you ever identified a problem that others had not noticed? How did you bring it to attention and address it?",
    difficulty: 60,
    targetSkills: ["initiative", "communication", "analytical-thinking"],
    tags: ["proactivity", "problem-identification"],
    isActive: true,
    source: "seed",
  },
  {
    category: "problem-solving",
    text: "Tell me about a time you had to debug or troubleshoot something under time pressure. How did you stay focused?",
    difficulty: 65,
    targetSkills: ["analytical-thinking", "resilience", "confidence"],
    tags: ["time-pressure", "debugging", "focus"],
    isActive: true,
    source: "seed",
  },
  {
    category: "problem-solving",
    text: "Describe a situation where your initial solution did not work. How did you pivot, and what was the final outcome?",
    difficulty: 70,
    targetSkills: ["resilience", "reasoning", "adaptability"],
    tags: ["iteration", "pivot", "resilience"],
    isActive: true,
    source: "seed",
  },
  {
    category: "problem-solving",
    text: "Give an example of how you used data or evidence to solve a problem that others were approaching intuitively.",
    difficulty: 75,
    targetSkills: ["analytical-thinking", "communication", "confidence"],
    tags: ["data-driven", "evidence", "intermediate"],
    isActive: true,
    source: "seed",
  },
  {
    category: "problem-solving",
    text: "Describe the most ambiguous or ill-defined problem you have had to work through. How did you frame and structure it?",
    difficulty: 80,
    targetSkills: ["reasoning", "structure", "analytical-thinking"],
    tags: ["ambiguity", "framing", "advanced"],
    isActive: true,
    source: "seed",
  },
];

export async function seedQuestions(): Promise<number> {
  console.log(`[Seed] Upserting ${questions.length} situational questions...`);

  let upsertedCount = 0;
  for (const q of questions) {
    await Question.findOneAndUpdate(
      { text: q.text },
      { $set: q },
      { upsert: true, new: true }
    );
    upsertedCount++;
  }

  return upsertedCount;
}

// Standalone execution
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, "/")) {
  (async () => {
    try {
      console.log(`[Seed] Connecting to MongoDB at ${config.MONGO_URI}...`);
      await mongoose.connect(config.MONGO_URI);
      const count = await seedQuestions();
      console.log(`[Seed] Successfully seeded ${count} questions.`);
    } catch (err) {
      console.error("[Seed] Error seeding questions:", err);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      console.log("[Seed] Database connection closed.");
    }
  })();
}
