import { Schema, model, Document, type Model, Types } from "mongoose";

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
  referenceText?: string;
  exerciseType?: string;
  // Situational question context (populated when exercise type = "situational")
  questionText?: string;
  questionId?: Types.ObjectId;
  questionCategory?: string;
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    mode: {
      type: String,
      required: true,
      enum: ["voice", "text"],
    },
    audioPath: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
    durationSec: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: ["queued", "processing", "complete", "failed"],
      default: "queued",
      index: true,
    },
    errorCode: {
      type: String,
      required: false,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "Analysis",
      required: false,
    },
    recommendationId: {
      type: Schema.Types.ObjectId,
      ref: "Recommendation",
      required: false,
    },
    referenceText: {
      type: String,
      required: false,
    },
    exerciseType: {
      type: String,
      required: false,
    },
    // Situational question context
    questionText: {
      type: String,
      required: false,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: false,
    },
    questionCategory: {
      type: String,
      required: false,
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

sessionSchema.index({ userId: 1, createdAt: -1 });

export const Session: Model<ISession> = model<ISession>(
  "Session",
  sessionSchema
);
