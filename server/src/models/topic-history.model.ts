import { Schema, model, Document, type Model, Types } from "mongoose";
import type { TopicCategory } from "./topic.model.js";

export interface ITopicHistory extends Document {
  userId: Types.ObjectId;
  topicId: Types.ObjectId;
  category: TopicCategory;
  sessionId?: Types.ObjectId;
  attemptedAt: Date;
}

const topicHistorySchema = new Schema<ITopicHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["general", "academic", "social", "professional"],
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: false,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

topicHistorySchema.index({ userId: 1, topicId: 1 }, { unique: true });
topicHistorySchema.index({ userId: 1, category: 1 });

export const TopicHistory: Model<ITopicHistory> = model<ITopicHistory>(
  "TopicHistory",
  topicHistorySchema
);
