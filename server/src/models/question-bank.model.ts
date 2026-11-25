import { Schema, model, Document, type Model } from "mongoose";

export type SituationalCategory =
  | "teamwork"
  | "conflict-resolution"
  | "leadership"
  | "decision-making"
  | "workplace-ethics"
  | "problem-solving";

export interface IQuestion extends Document {
  category: SituationalCategory;
  text: string;
  difficulty: number; // 0-100
  targetSkills: string[];
  tags: string[];
  isActive: boolean;
  source: "seed" | "manual";
  createdAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "teamwork",
        "conflict-resolution",
        "leadership",
        "decision-making",
        "workplace-ethics",
        "problem-solving",
      ],
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    targetSkills: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["seed", "manual"],
      default: "seed",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

questionSchema.index({ category: 1, isActive: 1 });

export const Question: Model<IQuestion> = model<IQuestion>(
  "Question",
  questionSchema
);
