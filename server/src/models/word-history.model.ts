import { Schema, model, Document, type Model, Types } from "mongoose";
import type { WordDifficulty } from "./word-bank.model.js";

export interface IWordHistory extends Document {
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  wordText: string;
  difficulty: WordDifficulty;
  recognized: boolean;
  transcribedText?: string;
  attempts: number;
  lastAttemptedAt: Date;
}

const wordHistorySchema = new Schema<IWordHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true,
    },
    wordText: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
    },
    recognized: {
      type: Boolean,
      required: true,
    },
    transcribedText: {
      type: String,
      required: false,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

wordHistorySchema.index({ userId: 1, wordId: 1 }, { unique: true });
wordHistorySchema.index({ userId: 1, difficulty: 1 });

export const WordHistory: Model<IWordHistory> = model<IWordHistory>(
  "WordHistory",
  wordHistorySchema
);
