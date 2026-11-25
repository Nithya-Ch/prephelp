import mongoose from "mongoose";
import { config } from "./config.js";
import { Word, type WordDifficulty } from "./models/word-bank.model.js";

export interface SeedWord {
  word: string;
  phonetic?: string;
  difficulty: WordDifficulty;
  category: "professional" | "technical" | "academic";
  exampleSentence?: string;
  isActive: boolean;
}

export const seedWordsList: SeedWord[] = [
  // ── BEGINNER (20 words) ──────────────────────────────────
  {
    word: "collaborate",
    phonetic: "/kəˈlæb.ə.reɪt/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "We need to collaborate closely with the marketing team on this launch.",
    isActive: true,
  },
  {
    word: "analysis",
    phonetic: "/əˈnæl.ə.sɪs/",
    difficulty: "beginner",
    category: "academic",
    exampleSentence: "A thorough analysis of the user survey revealed three primary pain points.",
    isActive: true,
  },
  {
    word: "strategy",
    phonetic: "/ˈstræt.ə.dʒi/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "Our product strategy focuses on mobile-first accessibility.",
    isActive: true,
  },
  {
    word: "feedback",
    phonetic: "/ˈfiːd.bæk/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "Constructive feedback enables engineering squads to iterate rapidly.",
    isActive: true,
  },
  {
    word: "objective",
    phonetic: "/əbˈdʒek.tɪv/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "The primary objective of this sprint is stability and performance.",
    isActive: true,
  },
  {
    word: "efficient",
    phonetic: "/ɪˈfɪʃ.ənt/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "We refactored the query to make data ingestion far more efficient.",
    isActive: true,
  },
  {
    word: "initiative",
    phonetic: "/ɪˈnɪʃ.ə.tɪv/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "She demonstrated strong initiative by automating the reporting cycle.",
    isActive: true,
  },
  {
    word: "milestone",
    phonetic: "/ˈmaɪl.stoʊn/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "Completing the beta testing is our major quarterly milestone.",
    isActive: true,
  },
  {
    word: "prioritize",
    phonetic: "/praɪˈɔːr.ə.taɪz/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "We must prioritize security patches before shipping new features.",
    isActive: true,
  },
  {
    word: "evaluate",
    phonetic: "/ɪˈvæl.ju.eɪt/",
    difficulty: "beginner",
    category: "academic",
    exampleSentence: "We will evaluate both cloud architectures based on latency and cost.",
    isActive: true,
  },
  {
    word: "negotiate",
    phonetic: "/nəˈɡoʊ.ʃi.eɪt/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "He helped negotiate the licensing terms with external suppliers.",
    isActive: true,
  },
  {
    word: "framework",
    phonetic: "/ˈfreɪm.wɜːrk/",
    difficulty: "beginner",
    category: "technical",
    exampleSentence: "We adopted a lightweight React framework for component modularity.",
    isActive: true,
  },
  {
    word: "consistent",
    phonetic: "/kənˈsɪs.tənt/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "Consistent documentation standards reduce developer onboarding overhead.",
    isActive: true,
  },
  {
    word: "deadline",
    phonetic: "/ˈded.laɪn/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "The client agreed to extend the delivery deadline by one week.",
    isActive: true,
  },
  {
    word: "resolve",
    phonetic: "/rɪˈzɑːlv/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "The lead engineer stepped in to resolve the technical bottleneck.",
    isActive: true,
  },
  {
    word: "scalable",
    phonetic: "/ˈskeɪ.lə.bəl/",
    difficulty: "beginner",
    category: "technical",
    exampleSentence: "Building scalable backend services requires stateless application design.",
    isActive: true,
  },
  {
    word: "schedule",
    phonetic: "/ˈskedʒ.uːl/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "We updated the release schedule to allow comprehensive regression testing.",
    isActive: true,
  },
  {
    word: "presentation",
    phonetic: "/ˌprez.ənˈteɪ.ʃən/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "Her keynote presentation clearly outlined the quarterly roadmap.",
    isActive: true,
  },
  {
    word: "competence",
    phonetic: "/ˈkɑːm.pə.təns/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "He displayed remarkable technical competence throughout the coding interview.",
    isActive: true,
  },
  {
    word: "workflow",
    phonetic: "/ˈwɜːrk.floʊ/",
    difficulty: "beginner",
    category: "professional",
    exampleSentence: "Continuous integration streamlines our development and deployment workflow.",
    isActive: true,
  },

  // ── INTERMEDIATE (20 words) ──────────────────────────────────
  {
    word: "architecture",
    phonetic: "/ˈɑːr.kə.tek.tʃɚ/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Microservices architecture enables independent service deployment and scaling.",
    isActive: true,
  },
  {
    word: "synchronization",
    phonetic: "/ˌsɪŋ.krə.nəˈzeɪ.ʃən/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Distributed cache synchronization mitigated stale database reads effectively.",
    isActive: true,
  },
  {
    word: "asynchronous",
    phonetic: "/eɪˈsɪŋ.krə.nəs/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Asynchronous messaging decouples request handling from background workers.",
    isActive: true,
  },
  {
    word: "methodology",
    phonetic: "/ˌmeθ.əˈdɑː.lə.dʒi/",
    difficulty: "intermediate",
    category: "academic",
    exampleSentence: "Our agile methodology combines two-week sprints with blameless retrospectives.",
    isActive: true,
  },
  {
    word: "feasibility",
    phonetic: "/ˌfiː.zəˈbɪl.ə.t̬i/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "We conducted a feasibility study before migrating to Kubernetes clusters.",
    isActive: true,
  },
  {
    word: "discrepancy",
    phonetic: "/dɪˈskrep.ən.si/",
    difficulty: "intermediate",
    category: "academic",
    exampleSentence: "The audit revealed an intermittent discrepancy between ledger balances.",
    isActive: true,
  },
  {
    word: "implementation",
    phonetic: "/ˌɪm.plə.menˈteɪ.ʃən/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "The reference implementation demonstrated substantial throughput gains.",
    isActive: true,
  },
  {
    word: "perspective",
    phonetic: "/pɚˈspek.tɪv/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "Incorporating user perspectives early prevents costly interface redesigns.",
    isActive: true,
  },
  {
    word: "infrastructure",
    phonetic: "/ˈɪn.frəˌstrʌk.tʃɚ/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Cloud infrastructure provisioning is managed through declarative Terraform scripts.",
    isActive: true,
  },
  {
    word: "reconciliation",
    phonetic: "/ˌrek.ənˌsɪl.iˈeɪ.ʃən/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "Automated daily reconciliation ensures financial records match payment processor webhooks.",
    isActive: true,
  },
  {
    word: "optimization",
    phonetic: "/ˌɑːp.tə.məˈzeɪ.ʃən/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Query index optimization reduced p99 endpoint latency by sixty percent.",
    isActive: true,
  },
  {
    word: "collaborative",
    phonetic: "/kəˈlæb.ɚ.ə.t̬ɪv/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "Pair programming fosters collaborative problem-solving and rapid knowledge transfer.",
    isActive: true,
  },
  {
    word: "synthesize",
    phonetic: "/ˈsɪn.θə.saɪz/",
    difficulty: "intermediate",
    category: "academic",
    exampleSentence: "The analyst was able to synthesize multi-source telemetry data concisely.",
    isActive: true,
  },
  {
    word: "vulnerability",
    phonetic: "/ˌvʌl.nɚ.əˈbɪl.ə.t̬i/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Static code analysis detected a high-severity cross-site scripting vulnerability.",
    isActive: true,
  },
  {
    word: "contingency",
    phonetic: "/kənˈtɪn.dʒən.si/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "Our disaster recovery contingency plan includes multi-region automated failover.",
    isActive: true,
  },
  {
    word: "preliminary",
    phonetic: "/prɪˈlɪm.ə.ner.i/",
    difficulty: "intermediate",
    category: "academic",
    exampleSentence: "Preliminary performance benchmarks indicate a forty percent reduction in memory usage.",
    isActive: true,
  },
  {
    word: "comprehensive",
    phonetic: "/ˌkɑːm.prəˈhen.sɪv/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "We instituted comprehensive unit and integration test coverage across all repos.",
    isActive: true,
  },
  {
    word: "articulate",
    phonetic: "/ɑːrˈtɪk.jə.lət/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "An effective technical lead must articulate design tradeoffs to non-engineers.",
    isActive: true,
  },
  {
    word: "accountability",
    phonetic: "/əˌkaʊn.t̬əˈbɪl.ə.t̬i/",
    difficulty: "intermediate",
    category: "professional",
    exampleSentence: "Clear code ownership establishes transparent operational accountability.",
    isActive: true,
  },
  {
    word: "configuration",
    phonetic: "/kənˌfɪɡ.jəˈreɪ.ʃən/",
    difficulty: "intermediate",
    category: "technical",
    exampleSentence: "Dynamic environment configuration avoids hardcoding sensitive credentials in source code.",
    isActive: true,
  },

  // ── ADVANCED (20 words) ──────────────────────────────────
  {
    word: "heterogeneous",
    phonetic: "/ˌhet̬.ɚ.oʊˈdʒiː.ni.əs/",
    difficulty: "advanced",
    category: "academic",
    exampleSentence: "Orchestrating workloads across heterogeneous cloud environments demands strict abstraction layers.",
    isActive: true,
  },
  {
    word: "idempotency",
    phonetic: "/ˌaɪ.dəmˈpoʊ.tən.si/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Payment processing APIs enforce idempotency via unique request tokens to prevent duplicate billing.",
    isActive: true,
  },
  {
    word: "amortization",
    phonetic: "/ˌæm.ɚ.t̬əˈzeɪ.ʃən/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "The dynamic array implementation guarantees amortized constant time complexity for insertions.",
    isActive: true,
  },
  {
    word: "indispensable",
    phonetic: "/ˌɪn.dɪˈspen.sə.bəl/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "Automated regression testing is indispensable for zero-downtime continuous deployment pipelines.",
    isActive: true,
  },
  {
    word: "ephemeral",
    phonetic: "/əˈfem.ɚ.əl/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Serverless container instances rely on ephemeral storage discarded after task execution.",
    isActive: true,
  },
  {
    word: "ubiquitous",
    phonetic: "/juːˈbɪk.wə.t̬əs/",
    difficulty: "advanced",
    category: "academic",
    exampleSentence: "RESTful architecture has achieved ubiquitous adoption in enterprise web development.",
    isActive: true,
  },
  {
    word: "dichotomy",
    phonetic: "/daɪˈkɑː.t̬ə.mi/",
    difficulty: "advanced",
    category: "academic",
    exampleSentence: "Engineers often face the false dichotomy between shipping quickly and writing maintainable code.",
    isActive: true,
  },
  {
    word: "anomalous",
    phonetic: "/əˈnɑː.mə.ləs/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Real-time stream telemetry flagged an anomalous spike in connection timeouts across the cluster.",
    isActive: true,
  },
  {
    word: "juxtaposition",
    phonetic: "/ˌdʒʌk.stə.pəˈzɪʃ.ən/",
    difficulty: "advanced",
    category: "academic",
    exampleSentence: "The juxtaposition of legacy monoliths alongside event-driven microservices required hybrid routing.",
    isActive: true,
  },
  {
    word: "concurrency",
    phonetic: "/kənˈkɝː.ən.si/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Managing optimistic concurrency control prevents race conditions during high-volume checkout bursts.",
    isActive: true,
  },
  {
    word: "deterministic",
    phonetic: "/dɪˌtɝː.mɪˈnɪs.tɪk/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Build systems must be deterministic to guarantee reproducible binary artifacts across environments.",
    isActive: true,
  },
  {
    word: "parsimonious",
    phonetic: "/ˌpɑːr.səˈmoʊ.ni.əs/",
    difficulty: "advanced",
    category: "academic",
    exampleSentence: "A parsimonious microservices taxonomy avoids over-fragmentation and excessive inter-service chatter.",
    isActive: true,
  },
  {
    word: "quintessential",
    phonetic: "/ˌkwɪn.təˈsen.ʃəl/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "The STAR method is the quintessential framework for structuring behavioural interview responses.",
    isActive: true,
  },
  {
    word: "substantiate",
    phonetic: "/səbˈstæn.ʃi.eɪt/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "Candidates should substantiate architectural claims with concrete benchmarks and production data.",
    isActive: true,
  },
  {
    word: "immutable",
    phonetic: "/ɪˈmjuː.t̬ə.bəl/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Immutable infrastructure deployments eliminate configuration drift across production server nodes.",
    isActive: true,
  },
  {
    word: "dissemination",
    phonetic: "/dɪˌsem.əˈneɪ.ʃən/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "Rapid dissemination of post-incident learnings ensures institutional memory across engineering orgs.",
    isActive: true,
  },
  {
    word: "circumvent",
    phonetic: "/ˌsɝː.kəmˈvent/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "Engineers should never circumvent code review protocols to rush unvalidated patches into production.",
    isActive: true,
  },
  {
    word: "repertoire",
    phonetic: "/ˈrep.ɚ.twɑːr/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "A versatile communicator possesses a broad repertoire of rhetorical tools for diverse stakeholder audiences.",
    isActive: true,
  },
  {
    word: "obsolescence",
    phonetic: "/ˌɑːb.səˈles.əns/",
    difficulty: "advanced",
    category: "technical",
    exampleSentence: "Proactive dependency refactoring prevents technological obsolescence in long-term enterprise systems.",
    isActive: true,
  },
  {
    word: "commensurate",
    phonetic: "/kəˈmen.sjɚ.ət/",
    difficulty: "advanced",
    category: "professional",
    exampleSentence: "Senior technical leaders receive autonomy commensurate with their track record of delivered value.",
    isActive: true,
  },
];

export async function seedWords(): Promise<number> {
  let upsertedCount = 0;
  for (const w of seedWordsList) {
    await Word.findOneAndUpdate(
      { word: w.word.toLowerCase() },
      { $set: w },
      { upsert: true, new: true }
    );
    upsertedCount++;
  }
  return upsertedCount;
}

if (process.argv[1]?.endsWith("seed-words.ts")) {
  mongoose
    .connect(config.MONGO_URI)
    .then(async () => {
      console.log("[Seed Words] Connected. Upserting words...");
      const count = await seedWords();
      console.log(`[Seed Words] Successfully seeded ${count} pronunciation words.`);
      await mongoose.connection.close();
    })
    .catch((err) => {
      console.error("[Seed Words] Error:", err);
      process.exit(1);
    });
}
