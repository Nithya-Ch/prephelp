import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().default("mongodb://mongo:27017/prephelp"),
  REDIS_URL: z.string().default("redis://redis:6379"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  COOKIE_DOMAIN: z.string().default("localhost"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  ML_SERVICE_URL: z.string().default("http://ml-service:8000"),
  STORAGE_DRIVER: z.string().default("local"),
  MAX_AUDIO_MB: z.coerce.number().default(10),
  MAX_AUDIO_SECONDS: z.coerce.number().default(180),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const rawEnv = {
  ...process.env,
  MONGO_URI:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://mongo:27017/prephelp",
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : "development_jwt_secret_change_in_production_min_32_chars"),
};

export const config = envSchema.parse(rawEnv);
export type Config = z.infer<typeof envSchema>;
