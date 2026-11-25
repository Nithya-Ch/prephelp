import { Schema, model, Document, type Model, Types } from "mongoose";

export type RecommendationStrategy =
  | "rule"
  | "weighted"
  | "bandit"
  | "random"
  | "fixed";

export interface IRecommendation extends Document {
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  exerciseId: Types.ObjectId;
  strategy: RecommendationStrategy;
  explanation: string;
  factors: Record<string, unknown>;
  outcome?: number;
  createdAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: false,
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    strategy: {
      type: String,
      required: true,
      enum: ["rule", "weighted", "bandit", "random", "fixed"],
    },
    explanation: {
      type: String,
      required: true,
    },
    factors: {
      type: Schema.Types.Mixed,
      default: {},
    },
    outcome: {
      type: Number,
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

recommendationSchema.index({ userId: 1, createdAt: -1 });

export const Recommendation: Model<IRecommendation> = model<IRecommendation>(
  "Recommendation",
  recommendationSchema
);
