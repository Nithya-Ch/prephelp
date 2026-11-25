import { Schema, model, Document, type Model } from "mongoose";

export type TopicCategory = "general" | "academic" | "social" | "professional";

export interface ITopic extends Document {
  text: string;
  category: TopicCategory;
  difficulty: number; // 0-100
  tags: string[];
  isActive: boolean;
  source: "seed" | "manual";
  createdAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["general", "academic", "social", "professional"],
      index: true,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
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

topicSchema.index({ category: 1, isActive: 1 });

export const Topic: Model<ITopic> = model<ITopic>("Topic", topicSchema);
