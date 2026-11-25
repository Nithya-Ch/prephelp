import { Schema, model, Document, type Model, Types } from "mongoose";

// --- Session Model ---
export type SessionMode = "voice" | "text";
export type SessionStatus = "queued" | "processing" | "complete" | "failed";

export interface ISession extends Document {
  userId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  mode: SessionMode;
  audioPath?: string;
  text?: string;
  durationSec?: number;
  status: SessionStatus;
  errorCode?: string;
  analysisId?: Types.ObjectId;
  recommendationId?: Types.ObjectId;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
    mode: { type: String, required: true, enum: ["voice", "text"] },
    audioPath: { type: String },
    text: { type: String },
    durationSec: { type: Number },
    status: { type: String, required: true, enum: ["queued", "processing", "complete", "failed"], default: "queued", index: true },
    errorCode: { type: String },
    analysisId: { type: Schema.Types.ObjectId, ref: "Analysis" },
    recommendationId: { type: Schema.Types.ObjectId, ref: "Recommendation" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
sessionSchema.index({ userId: 1, createdAt: -1 });
export const Session: Model<ISession> = model<ISession>("Session", sessionSchema);

// --- Analysis Model ---
export interface IAnalysis extends Document {
  sessionId: Types.ObjectId;
  transcript: string;
  words: Array<{ w: string; start: number; end: number; flag?: string }>;
  metrics: Record<string, unknown>;
  scores: Record<string, number | null | undefined>;
  flags: Array<{ type: string; start?: number; end?: number; detail?: string }>;
  errorPatterns: Record<string, number>;
  llmUsed: boolean;
  fallbackUsed: boolean;
  versions: Record<string, unknown>;
  createdAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, unique: true, index: true },
    transcript: { type: String, default: "" },
    words: { type: [{ w: String, start: Number, end: Number, flag: String }], default: [] },
    metrics: { type: Schema.Types.Mixed, default: {} },
    scores: { type: Schema.Types.Mixed, default: {} },
    flags: { type: [{ type: String, start: Number, end: Number, detail: String }], default: [] },
    errorPatterns: { type: Schema.Types.Mixed, default: {} },
    llmUsed: { type: Boolean, default: false },
    fallbackUsed: { type: Boolean, default: false },
    versions: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
export const Analysis: Model<IAnalysis> = model<IAnalysis>("Analysis", analysisSchema);

// --- Feedback Model ---
export interface IFeedback extends Document {
  sessionId: Types.ObjectId;
  summary: string;
  strengths: string[];
  improvements: string[];
  tip: string;
  fallbackUsed: boolean;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, unique: true, index: true },
    summary: { type: String, required: true },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    tip: { type: String, required: true },
    fallbackUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
export const Feedback: Model<IFeedback> = model<IFeedback>("Feedback", feedbackSchema);

// --- LearnerProfile Model (append-only snapshots) ---
export interface ILearnerProfile extends Document {
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  dimensions: Record<string, { score: number; uncertainty: number; trend: number; lastPracticed: Date; attempts: number }>;
  errorPatterns: Record<string, number>;
  updatedAt: Date;
}

const learnerProfileSchema = new Schema<ILearnerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    dimensions: { type: Schema.Types.Mixed, default: {} },
    errorPatterns: { type: Schema.Types.Mixed, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
learnerProfileSchema.index({ userId: 1, updatedAt: -1 });
export const LearnerProfile: Model<ILearnerProfile> = model<ILearnerProfile>("LearnerProfile", learnerProfileSchema);

// --- Recommendation Model ---
export interface IRecommendation extends Document {
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  exerciseId: Types.ObjectId;
  strategy: string;
  explanation: string;
  factors: Record<string, unknown>;
  outcome?: number;
  createdAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
    strategy: { type: String, required: true, enum: ["rule", "weighted", "bandit", "random", "fixed"] },
    explanation: { type: String, required: true },
    factors: { type: Schema.Types.Mixed, default: {} },
    outcome: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
recommendationSchema.index({ userId: 1, createdAt: -1 });
export const Recommendation: Model<IRecommendation> = model<IRecommendation>("Recommendation", recommendationSchema);

// --- Exercise Model (for populate) ---
export interface IExercise extends Document {
  type: string;
  prompt: string;
  targetSkills: string[];
  difficulty: number;
  timeLimitSec: number;
  prepTimeSec: number;
  tags: string[];
  isActive: boolean;
  referenceText?: string;
}

const exerciseSchema = new Schema<IExercise>(
  {
    type: { type: String, required: true },
    prompt: { type: String, required: true },
    targetSkills: { type: [String], default: [] },
    difficulty: { type: Number, default: 50 },
    timeLimitSec: { type: Number, default: 120 },
    prepTimeSec: { type: Number, default: 10 },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    referenceText: { type: String },
  },
  { timestamps: true }
);
export const Exercise: Model<IExercise> = model<IExercise>("Exercise", exerciseSchema);
