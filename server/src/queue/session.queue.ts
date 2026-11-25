import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";

export interface SessionJobData {
  sessionId: string;
}

export const SESSION_QUEUE_NAME = "session-analysis";

/**
 * BullMQ queue instance for asynchronous session audio and text analysis.
 */
export const sessionQueue = new Queue<SessionJobData>(SESSION_QUEUE_NAME, {
  connection: redisConnection,
});
