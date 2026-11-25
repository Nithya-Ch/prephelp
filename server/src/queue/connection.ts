import { Redis } from "ioredis";
import { config } from "../config.js";

/**
 * Shared IORedis connection configured for BullMQ compatibility.
 * When Redis is unavailable locally, enableOfflineQueue: false ensures
 * operations fail fast and fall back to the in-process direct processor
 * instead of hanging indefinitely.
 */
export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return 1000;
  },
});

redisConnection.on("error", () => {
  // Silence unhandled connection errors when running without local Redis
});
