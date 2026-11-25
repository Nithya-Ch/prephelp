import { Schema, model, Document, type Model, Types } from "mongoose";
import type { SituationalCategory } from "./question-bank.model.js";

/**
 * Records every question a user has attempted in a Situational exercise.
 * Used to prevent repetition across sessions.
 */
export interface IQuestionHistory extends Document {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  category: SituationalCategory;
  sessionId?: Types.ObjectId; // the session that resulted from answering this question
  attemptedAt: Date;
}

const questionHistorySchema = new Schema<IQuestionHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
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

// Composite index: quickly find all question IDs a user has attempted
questionHistorySchema.index({ userId: 1, questionId: 1 });
// Composite index: filter by user + category for category-scoped sessions
questionHistorySchema.index({ userId: 1, category: 1, attemptedAt: -1 });

export const QuestionHistory: Model<IQuestionHistory> =
  model<IQuestionHistory>("QuestionHistory", questionHistorySchema);
