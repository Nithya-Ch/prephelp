import { Schema, model, Document, type Model } from "mongoose";

export type ExerciseType =
  | "read-aloud"
  | "interview"
  | "description"
  | "written"
  | "retelling"
  | "professional-introduction"
  | "situational"
  | "extempore"
  | "pronunciation"
  | "rapid-fire";

export type ExerciseSource = "seed" | "llm" | "manual";

export interface IExercise extends Document {
  type: ExerciseType;
  prompt: string;
  targetSkills: string[];
  difficulty: number;
  timeLimitSec: number;
  prepTimeSec: number;
  tags: string[];
  isActive: boolean;
  source: ExerciseSource;
  reviewed: boolean;
  referenceText?: string;
  createdAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "read-aloud",
        "interview",
        "description",
        "written",
        "retelling",
        "professional-introduction",
        "situational",
        "extempore",
        "pronunciation",
        "rapid-fire",
      ],
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    targetSkills: {
      type: [String],
      required: true,
      default: [],
    },
    difficulty: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeLimitSec: {
      type: Number,
      required: true,
      min: 0,
    },
    prepTimeSec: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["seed", "llm", "manual"],
      default: "seed",
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
    referenceText: {
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

exerciseSchema.index({ targetSkills: 1 });
exerciseSchema.index({ isActive: 1 });
exerciseSchema.index({ targetSkills: 1, isActive: 1 });
exerciseSchema.index({ type: 1, isActive: 1 });

export const Exercise: Model<IExercise> = model<IExercise>(
  "Exercise",
  exerciseSchema
);
