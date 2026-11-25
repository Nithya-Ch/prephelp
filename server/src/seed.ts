import mongoose from "mongoose";
import { config } from "./config.js";
import { Exercise, type IExercise } from "./models/exercise.model.js";
import { seedTopics } from "./seed-topics.js";
import { seedWords } from "./seed-words.js";
import { seedQuestions } from "./seed-questions.js";

type SeedExercise = Omit<Partial<IExercise>, "_id" | "createdAt"> & {
  type:
    | "read-aloud"
    | "interview"
    | "description"
    | "written"
    | "retelling"
    | "professional-introduction"
    | "situational"
    | "extempore"
    | "pronunciation"
    | "rapid-fire";
  prompt: string;
  targetSkills: string[];
  difficulty: number;
  timeLimitSec: number;
  prepTimeSec: number;
  tags: string[];
  isActive: boolean;
  source: "seed";
  reviewed: boolean;
  referenceText?: string;
};

const exercises: SeedExercise[] = [
  // ── Extempore (template exercise — topic supplied dynamically) ──
  {
    type: "extempore",
    prompt: "Extempore Speaking Prompt",
    targetSkills: ["spontaneous-speaking", "structure", "fluency", "depth", "coherence"],
    difficulty: 60,
    timeLimitSec: 120,
    prepTimeSec: 30,
    tags: ["extempore", "spontaneous", "public-speaking"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // ── Pronunciation Practice (template exercise — word supplied dynamically) ──
  {
    type: "pronunciation",
    prompt: "Pronunciation Practice Word",
    targetSkills: ["articulation", "enunciation", "phonetic-accuracy"],
    difficulty: 40,
    timeLimitSec: 15,
    prepTimeSec: 5,
    tags: ["pronunciation", "word-level", "articulation"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // ── Rapid Fire Interview (template exercise — 10 questions sequentially) ──
  {
    type: "rapid-fire",
    prompt: "Interview Rapid Fire Session (10 Questions)",
    targetSkills: ["stamina", "consistency", "structure", "versatility", "conciseness"],
    difficulty: 70,
    timeLimitSec: 90,
    prepTimeSec: 15,
    tags: ["rapid-fire", "comprehensive", "interview-simulation"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // ── Situational Question (template exercise — question text is supplied dynamically) ──
  {
    type: "situational",
    prompt: "Situational Question",
    targetSkills: ["reasoning", "communication", "structure", "relevance"],
    difficulty: 55,
    timeLimitSec: 150,
    prepTimeSec: 20,
    tags: ["situational", "behavioral", "general"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // ── Professional Introduction exercises ──
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

  // 3 Read-Aloud exercises
  {
    type: "read-aloud",
    prompt:
      "Read the following technical passage aloud clearly, paying attention to pronunciation, natural cadence, and punctuation pauses.",
    referenceText:
      "Microservices architecture structures an application as a collection of loosely coupled, independently deployable services. Each service communicates through well-defined APIs and can be maintained by specialized engineering teams.",
    targetSkills: ["pronunciation", "pacing", "fluency"],
    difficulty: 35,
    timeLimitSec: 60,
    prepTimeSec: 15,
    tags: ["technical", "reading", "foundational"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "read-aloud",
    prompt:
      "Read the executive project summary aloud clearly with natural inflection and professional confidence.",
    referenceText:
      "In our third quarter retrospective, the platform achieved ninety-nine point nine percent uptime while sustaining a forty percent increase in concurrent transactions. Our proactive caching strategy and automated database failovers mitigated potential bottlenecks effectively.",
    targetSkills: ["intonation", "clarity", "confidence"],
    difficulty: 55,
    timeLimitSec: 75,
    prepTimeSec: 20,
    tags: ["executive", "retrospective", "performance"],
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
    tags: ["incident-response", "client-facing", "advanced"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // 3 Interview exercises
  {
    type: "interview",
    prompt:
      "Tell me about a challenging technical bug you encountered in a past project. How did you systematically diagnose and resolve it?",
    targetSkills: ["structure", "confidence", "fluency"],
    difficulty: 45,
    timeLimitSec: 120,
    prepTimeSec: 30,
    tags: ["behavioral", "debugging", "star-method"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "interview",
    prompt:
      "Describe a scenario where you disagreed with a colleague or technical lead regarding a design decision. How did you navigate the conversation and reach consensus?",
    targetSkills: ["diplomacy", "structure", "vocabulary"],
    difficulty: 65,
    timeLimitSec: 150,
    prepTimeSec: 45,
    tags: ["interpersonal", "teamwork", "leadership"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "interview",
    prompt:
      "How do you evaluate the trade-offs between shipping a feature quickly versus investing time in long-term maintainability, automated testing, and refactoring?",
    targetSkills: ["critical-thinking", "clarity", "confidence"],
    difficulty: 75,
    timeLimitSec: 180,
    prepTimeSec: 45,
    tags: ["architecture", "engineering-culture", "tradeoffs"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // 3 Topic Description exercises
  {
    type: "description",
    prompt:
      "Describe the architecture of a full-stack application you recently built, walking through the client, server, and persistent database layers.",
    targetSkills: ["structure", "vocabulary", "pacing"],
    difficulty: 50,
    timeLimitSec: 120,
    prepTimeSec: 30,
    tags: ["system-architecture", "technical-exposition"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "description",
    prompt:
      "Explain the concept of RESTful API design to a non-technical stakeholder using an intuitive, real-world analogy.",
    targetSkills: ["clarity", "vocabulary", "empathy"],
    difficulty: 60,
    timeLimitSec: 120,
    prepTimeSec: 45,
    tags: ["analogies", "communication", "stakeholder-management"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "description",
    prompt:
      "Describe the key operational differences and trade-offs between relational SQL databases and document-oriented NoSQL databases.",
    targetSkills: ["depth", "fluency", "structure"],
    difficulty: 80,
    timeLimitSec: 150,
    prepTimeSec: 45,
    tags: ["databases", "data-modeling", "comparison"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // 3 Written exercises
  {
    type: "written",
    prompt:
      "Draft a concise Pull Request description explaining a database query index optimization that reduces user endpoint latency by sixty percent.",
    targetSkills: ["grammar", "vocabulary", "structure"],
    difficulty: 40,
    timeLimitSec: 180,
    prepTimeSec: 30,
    tags: ["pull-request", "code-review", "documentation"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "written",
    prompt:
      "Compose a professional status notification email informing enterprise customers about scheduled weekend maintenance and expected minimal service interruption.",
    targetSkills: ["grammar", "vocabulary", "structure"],
    difficulty: 55,
    timeLimitSec: 240,
    prepTimeSec: 60,
    tags: ["client-communication", "email", "professionalism"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "written",
    prompt:
      "Write a blameless postmortem summary detailing a recent production service degradation, covering root cause, immediate containment, and preventative action items.",
    targetSkills: ["grammar", "structure", "clarity"],
    difficulty: 75,
    timeLimitSec: 300,
    prepTimeSec: 60,
    tags: ["incident-postmortem", "reliability", "actionability"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },

  // 3 Retelling prompts
  {
    type: "retelling",
    prompt:
      "During sprint planning, your team lead explained why the upcoming release will focus entirely on technical debt and security patches instead of new user features. Retell the key points to a developer who missed the standup.",
    targetSkills: ["fluency", "pacing", "structure"],
    difficulty: 50,
    timeLimitSec: 90,
    prepTimeSec: 30,
    tags: ["sprint-planning", "recap", "agile"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "retelling",
    prompt:
      "A support engineer summarized three customer reports describing data latency during international batch file processing. Retell the problem and proposed mitigation to the engineering triage lead.",
    targetSkills: ["clarity", "confidence", "fluency"],
    difficulty: 65,
    timeLimitSec: 120,
    prepTimeSec: 30,
    tags: ["triage", "escalation", "customer-focus"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
  {
    type: "retelling",
    prompt:
      "After attending a technical presentation on Zero-Trust Network Architecture, synthesize and retell the three core tenets: verify explicitly, enforce least privilege, and assume breach.",
    targetSkills: ["structure", "vocabulary", "fluency"],
    difficulty: 80,
    timeLimitSec: 150,
    prepTimeSec: 45,
    tags: ["security", "zero-trust", "synthesis"],
    isActive: true,
    source: "seed",
    reviewed: true,
  },
];

/**
 * Seeds the database with initial placement interview exercises.
 */
async function seedExercises(): Promise<void> {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${config.MONGO_URI}...`);
    await mongoose.connect(config.MONGO_URI);

    console.log(`[Seed] Upserting ${exercises.length} exercises...`);

    let upsertedCount = 0;
    for (const ex of exercises) {
      await Exercise.findOneAndUpdate(
        { prompt: ex.prompt },
        { $set: ex },
        { upsert: true, new: true }
      );
      upsertedCount++;
    }

    console.log(`[Seed] Successfully seeded ${upsertedCount} exercises.`);

    console.log("[Seed] Seeding situational questions...");
    const questionCount = await seedQuestions();
    console.log(`[Seed] Successfully seeded ${questionCount} situational questions.`);

    console.log("[Seed] Seeding extempore topics...");
    const topicCount = await seedTopics();
    console.log(`[Seed] Successfully seeded ${topicCount} topics.`);

    console.log("[Seed] Seeding pronunciation words...");
    const wordCount = await seedWords();
    console.log(`[Seed] Successfully seeded ${wordCount} pronunciation words.`);
  } catch (err) {
    console.error("[Seed] Error seeding exercises:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("[Seed] Database connection closed.");
  }
}

seedExercises();
