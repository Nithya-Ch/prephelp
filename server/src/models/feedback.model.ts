import { Schema, model, Document, type Model, Types } from "mongoose";

export interface ISentenceExample {
  original: string;
  improved: string;
  reason: string;
}

export interface IFeedback extends Document {
  sessionId: Types.ObjectId;
  summary: string;
  strengths: string[];
  improvements: string[];
  sentenceExamples: ISentenceExample[];
  tip: string;
  createdAt: Date;
}

const sentenceExampleSchema = new Schema<ISentenceExample>(
  {
    original: { type: String, required: true },
    improved: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const feedbackSchema = new Schema<IFeedback>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    sentenceExamples: {
      type: [sentenceExampleSchema],
      default: [],
    },
    tip: {
      type: String,
      required: true,
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

export const Feedback: Model<IFeedback> = model<IFeedback>(
  "Feedback",
  feedbackSchema
);
