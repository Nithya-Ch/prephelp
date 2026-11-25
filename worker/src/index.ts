import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { config } from "./config.js";
import { processSessionJob } from "./session.worker.js";

const SESSION_QUEUE_NAME = "session-analysis";

async function startWorker(): Promise<void> {
  try {
    console.log(`[Worker] Connecting to MongoDB at ${config.MONGO_URI}...`);
    await mongoose.connect(config.MONGO_URI);
    console.log("[Worker] Connected to MongoDB successfully.");

    const connection = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    const worker = new Worker(
      SESSION_QUEUE_NAME,
      async (job) => {
        await processSessionJob(job);
      },
      {
        connection,
        concurrency: 2,
      }
    );

    worker.on("ready", () => {
      console.log(`[Worker] BullMQ worker listening on queue '${SESSION_QUEUE_NAME}'`);
    });

    worker.on("completed", (job) => {
      console.log(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
    });

    const shutdown = async () => {
      console.log("[Worker] Shutting down worker gracefully...");
      await worker.close();
      await mongoose.disconnect();
      await connection.quit();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("[Worker] Fatal error starting worker:", err);
    process.exit(1);
  }
}

startWorker();
