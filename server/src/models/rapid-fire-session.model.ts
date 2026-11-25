import { Schema, model, Document, type Model, Types } from "mongoose";

export interface IRapidFireQuestion {
  order: number;
  questionType: "introduction" | "behavioral" | "competency" | "situational" | "career_motivation";
  questionText: string;
  categoryLabel: string;
  sessionId?: Types.ObjectId;
  transcript?: string;
  audioDuration?: number;
  scores?: {
    grammar?: number;
    vocabulary?: number;
    fluency?: number;
    pace?: number;
    filler_control?: number;
    structure?: number;
  };
  metrics?: {
    wpm?: number;
    pause_count?: number;
    filler_count?: number;
  };
  strengths?: string[];
  improvements?: string[];
  answeredAt?: Date;
}

export interface IRapidFireConsolidatedReport {
  overallScore: number;
  overallStrengths: string[];
  recurringWeaknesses: string[];
  bestQuestions: string[];
  needsImprovementQuestions: string[];
  commonLanguageMistakes: string[];
  repeatedFillerWords: string[];
  structureSuggestions: string[];
  sentenceImprovements: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  summary: string;
}

export interface IRapidFireSession extends Document {
  userId: Types.ObjectId;
  status: "in-progress" | "complete" | "abandoned";
  currentQuestionIndex: number;
  questions: IRapidFireQuestion[];
  consolidatedReport?: IRapidFireConsolidatedReport;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const rapidFireQuestionSchema = new Schema<IRapidFireQuestion>(
  {
    order: { type: Number, required: true },
    questionType: {
      type: String,
      required: true,
      enum: ["introduction", "behavioral", "competency", "situational", "career_motivation"],
    },
    questionText: { type: String, required: true },
    categoryLabel: { type: String, required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: false },
    transcript: { type: String, required: false },
    audioDuration: { type: Number, required: false },
    scores: { type: Schema.Types.Mixed, required: false },
    metrics: { type: Schema.Types.Mixed, required: false },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    answeredAt: { type: Date, required: false },
  },
  { _id: false }
);

const rapidFireSessionSchema = new Schema<IRapidFireSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["in-progress", "complete", "abandoned"],
      default: "in-progress",
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    questions: {
      type: [rapidFireQuestionSchema],
      required: true,
    },
    consolidatedReport: {
      type: Schema.Types.Mixed,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

rapidFireSessionSchema.index({ userId: 1, createdAt: -1 });

export const RapidFireSession: Model<IRapidFireSession> = model<IRapidFireSession>(
  "RapidFireSession",
  rapidFireSessionSchema
);
