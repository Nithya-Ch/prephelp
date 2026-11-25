import type { Job } from "bullmq";
import { sessionQueue, type SessionJobData } from "./session.queue.js";

/**
 * Enqueues a session for background analysis.
 *
 * @param sessionId - Unique string identifier of the session document
 * @returns BullMQ Job instance
 */
export async function enqueueSession(
  sessionId: string
): Promise<Job<SessionJobData>> {
  return await sessionQueue.add(
    "analyze-session",
    { sessionId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // keep completed jobs for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 86400, // keep failed jobs for 24 hours
      },
    }
  );
}
