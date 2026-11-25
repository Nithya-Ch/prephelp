import { Schema, model, Document, type Model, Types } from "mongoose";

export interface IWordTimestamp {
  w: string;
  start: number;
  end: number;
  flag?: string;
}

export interface IAnalysisScores {
  grammar?: number;
  vocabulary?: number;
  fluency?: number;
  pace?: number;
  filler_control?: number;
  structure?: number;
  confidence?: number;
}

export interface IAnalysisFlag {
  type: string;
  start?: number;
  end?: number;
  detail?: string;
}

export interface IAnalysisVersions {
  whisperModel?: string;
  formulaVersion?: string;
  promptVersions?: Record<string, string>;
}

export interface IAnalysis extends Document {
  sessionId: Types.ObjectId;
  transcript: string;
  words: IWordTimestamp[];
  metrics: Record<string, unknown>;
  scores: IAnalysisScores;
  flags: IAnalysisFlag[];
  errorPatterns: Record<string, number>;
  llmUsed: boolean;
  fallbackUsed: boolean;
  versions: IAnalysisVersions;
  createdAt: Date;
}

const wordTimestampSchema = new Schema<IWordTimestamp>(
  {
    w: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    flag: { type: String, required: false },
  },
  { _id: false }
);

const analysisFlagSchema = new Schema<IAnalysisFlag>(
  {
    type: { type: String, required: true },
    start: { type: Number, required: false },
    end: { type: Number, required: false },
    detail: { type: String, required: false },
  },
  { _id: false }
);

const analysisSchema = new Schema<IAnalysis>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
      index: true,
    },
    transcript: {
      type: String,
      default: "",
    },
    words: {
      type: [wordTimestampSchema],
      default: [],
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
    scores: {
      grammar: { type: Number, min: 0, max: 100 },
      vocabulary: { type: Number, min: 0, max: 100 },
      fluency: { type: Number, min: 0, max: 100 },
      pace: { type: Number, min: 0, max: 100 },
      filler_control: { type: Number, min: 0, max: 100 },
      structure: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 },
    },
    flags: {
      type: [analysisFlagSchema],
      default: [],
    },
    errorPatterns: {
      type: Schema.Types.Mixed,
      default: {},
    },
    llmUsed: {
      type: Boolean,
      default: false,
    },
    fallbackUsed: {
      type: Boolean,
      default: false,
    },
    versions: {
      whisperModel: { type: String, default: "base" },
      formulaVersion: { type: String, default: "1.0.0" },
      promptVersions: { type: Schema.Types.Mixed, default: {} },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const Analysis: Model<IAnalysis> = model<IAnalysis>(
  "Analysis",
  analysisSchema
);
