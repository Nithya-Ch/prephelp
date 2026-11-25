import mongoose from "mongoose";
import { config } from "./config.js";
import { Topic, type TopicCategory } from "./models/topic.model.js";

export interface SeedTopic {
  text: string;
  category: TopicCategory;
  difficulty: number;
  tags: string[];
  isActive: boolean;
  source: "seed";
}

export const seedTopicsList: SeedTopic[] = [
  // ── GENERAL (8 topics) ──────────────────────────────────
  {
    text: "The impact of remote work on personal productivity and work-life balance.",
    category: "general",
    difficulty: 40,
    tags: ["remote-work", "productivity", "lifestyle"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Should artificial intelligence be regulated by international bodies?",
    category: "general",
    difficulty: 65,
    tags: ["ai", "ethics", "regulation", "technology"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The role of failure in achieving personal and career success.",
    category: "general",
    difficulty: 45,
    tags: ["growth-mindset", "resilience", "personal-development"],
    isActive: true,
    source: "seed",
  },
  {
    text: "How social media algorithms shape our perceptions and opinions.",
    category: "general",
    difficulty: 55,
    tags: ["social-media", "psychology", "culture"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Cashless societies: convenience versus privacy and financial inclusion.",
    category: "general",
    difficulty: 60,
    tags: ["finance", "privacy", "digital-economy"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Is space exploration worth the massive economic investment?",
    category: "general",
    difficulty: 50,
    tags: ["science", "space", "economy"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The decline of reading books in the age of short-form video content.",
    category: "general",
    difficulty: 40,
    tags: ["attention", "reading", "digital-media"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Electric vehicles: the actual environmental balance from manufacture to disposal.",
    category: "general",
    difficulty: 70,
    tags: ["sustainability", "ev", "environment"],
    isActive: true,
    source: "seed",
  },

  // ── ACADEMIC (8 topics) ──────────────────────────────────
  {
    text: "Should university curricula prioritize vocational skills over theoretical foundations?",
    category: "academic",
    difficulty: 55,
    tags: ["higher-education", "curriculum", "employment"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Standardized testing as an evaluation metric: fairness and effectiveness.",
    category: "academic",
    difficulty: 50,
    tags: ["testing", "education-policy", "assessment"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The democratization of learning through Massive Open Online Courses (MOOCs).",
    category: "academic",
    difficulty: 45,
    tags: ["edtech", "e-learning", "accessibility"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Interdisciplinary education: why engineering students should study humanities.",
    category: "academic",
    difficulty: 60,
    tags: ["humanities", "stem", "critical-thinking"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Open-access scientific publishing versus traditional peer-reviewed journals.",
    category: "academic",
    difficulty: 75,
    tags: ["research", "publishing", "open-science"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The ethics of generative AI in student dissertations and coursework.",
    category: "academic",
    difficulty: 65,
    tags: ["ai", "academic-integrity", "plagiarism"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Early specialization in high school vs broader foundational schooling.",
    category: "academic",
    difficulty: 50,
    tags: ["pedagogy", "schooling", "specialization"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The role of university research parks in national economic development.",
    category: "academic",
    difficulty: 70,
    tags: ["innovation", "patents", "economy"],
    isActive: true,
    source: "seed",
  },

  // ── SOCIAL (8 topics) ──────────────────────────────────
  {
    text: "Mental health awareness in high-pressure competitive academic environments.",
    category: "social",
    difficulty: 45,
    tags: ["mental-health", "wellbeing", "stress"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Urbanization and the gradual loss of traditional community networks.",
    category: "social",
    difficulty: 55,
    tags: ["urbanization", "community", "sociology"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The gig economy: empowerment of flexible labor or erosion of workers' rights?",
    category: "social",
    difficulty: 65,
    tags: ["gig-economy", "labor-rights", "society"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Fast fashion: consumer culture and ecological repercussions in developing nations.",
    category: "social",
    difficulty: 50,
    tags: ["fashion", "sustainability", "consumption"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Preserving indigenous languages in an increasingly globalized digital sphere.",
    category: "social",
    difficulty: 70,
    tags: ["linguistics", "culture", "heritage"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Ageing demographics and their socioeconomic consequences for healthcare systems.",
    category: "social",
    difficulty: 65,
    tags: ["healthcare", "demographics", "public-policy"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Citizen journalism and mobile reporting during major civic crises.",
    category: "social",
    difficulty: 55,
    tags: ["journalism", "media", "civic-engagement"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Addressing food wastage in urban supply chains through tech-enabled logistics.",
    category: "social",
    difficulty: 50,
    tags: ["food-security", "logistics", "urban-planning"],
    isActive: true,
    source: "seed",
  },

  // ── PROFESSIONAL (8 topics) ──────────────────────────────────
  {
    text: "How technical specialists can transition successfully into people leadership.",
    category: "professional",
    difficulty: 60,
    tags: ["leadership", "career-growth", "management"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Continuous upskilling versus deep domain specialization in tech careers.",
    category: "professional",
    difficulty: 50,
    tags: ["upskilling", "career-strategy", "specialization"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Building psychological safety in high-performing engineering squads.",
    category: "professional",
    difficulty: 65,
    tags: ["team-culture", "psychological-safety", "agile"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The effectiveness of asynchronous documentation versus recurring status meetings.",
    category: "professional",
    difficulty: 45,
    tags: ["async-communication", "documentation", "productivity"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Navigating ethical dilemmas when commercial pressure conflicts with product quality.",
    category: "professional",
    difficulty: 70,
    tags: ["ethics", "engineering-integrity", "quality"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Measuring developer productivity: why lines of code and velocity metrics fail.",
    category: "professional",
    difficulty: 65,
    tags: ["metrics", "engineering-management", "productivity"],
    isActive: true,
    source: "seed",
  },
  {
    text: "The art of non-defensive technical code review and collaborative feedback.",
    category: "professional",
    difficulty: 50,
    tags: ["code-review", "feedback", "collaboration"],
    isActive: true,
    source: "seed",
  },
  {
    text: "Managing technical debt in rapid-growth venture-backed startups.",
    category: "professional",
    difficulty: 75,
    tags: ["technical-debt", "startups", "scalability"],
    isActive: true,
    source: "seed",
  },
];

export async function seedTopics(): Promise<number> {
  let upsertedCount = 0;
  for (const t of seedTopicsList) {
    await Topic.findOneAndUpdate(
      { text: t.text },
      { $set: t },
      { upsert: true, new: true }
    );
    upsertedCount++;
  }
  return upsertedCount;
}

if (process.argv[1]?.endsWith("seed-topics.ts")) {
  mongoose
    .connect(config.MONGO_URI)
    .then(async () => {
      console.log("[Seed Topics] Connected. Upserting topics...");
      const count = await seedTopics();
      console.log(`[Seed Topics] Successfully seeded ${count} topics.`);
      await mongoose.connection.close();
    })
    .catch((err) => {
      console.error("[Seed Topics] Error:", err);
      process.exit(1);
    });
}
