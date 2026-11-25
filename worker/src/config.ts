import dotenv from "dotenv";

dotenv.config();

export interface WorkerConfig {
  MONGO_URI: string;
  REDIS_URL: string;
  ML_SERVICE_URL: string;
}

export const config: WorkerConfig = {
  MONGO_URI:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://mongo:27017/prephelp",
  REDIS_URL: process.env.REDIS_URL || "redis://redis:6379",
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://ml-service:8000",
};
