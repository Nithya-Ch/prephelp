import { Schema, model, Document, type Model, Types } from "mongoose";

export interface IDimensionStats {
  score: number;
  uncertainty: number;
  trend: number;
  lastPracticed: Date;
  attempts: number;
}

export interface ILearnerProfile extends Document {
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  dimensions: Record<string, IDimensionStats>;
  errorPatterns: Record<string, unknown>;
  updatedAt: Date;
}

const dimensionStatsSchema = new Schema<IDimensionStats>(
  {
    score: { type: Number, required: true, default: 50 },
    uncertainty: { type: Number, required: true, default: 1 },
    trend: { type: Number, required: true, default: 0 },
    lastPracticed: { type: Date, default: Date.now },
    attempts: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const learnerProfileSchema = new Schema<ILearnerProfile>(
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
    dimensions: {
      type: Map,
      of: dimensionStatsSchema,
      default: {},
    },
    errorPatterns: {
      type: Schema.Types.Mixed,
      default: {},
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

learnerProfileSchema.index({ userId: 1, updatedAt: -1 });

export const LearnerProfile: Model<ILearnerProfile> = model<ILearnerProfile>(
  "LearnerProfile",
  learnerProfileSchema
);
