import { Schema, model, Document, type Model } from "mongoose";

export type WordDifficulty = "beginner" | "intermediate" | "advanced";

export interface IWord extends Document {
  word: string;
  phonetic?: string;
  difficulty: WordDifficulty;
  category: "professional" | "technical" | "academic";
  exampleSentence?: string;
  isActive: boolean;
  createdAt: Date;
}

const wordSchema = new Schema<IWord>(
  {
    word: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phonetic: {
      type: String,
      required: false,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced"],
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["professional", "technical", "academic"],
      default: "professional",
    },
    exampleSentence: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

wordSchema.index({ difficulty: 1, isActive: 1 });

export const Word: Model<IWord> = model<IWord>("Word", wordSchema);
