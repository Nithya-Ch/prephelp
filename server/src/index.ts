import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import { config } from "./config.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { sessionRouter } from "./routes/session.routes.js";
import { exerciseRouter } from "./routes/exercise.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { questionRouter } from "./routes/question.routes.js";
import { topicRouter } from "./routes/topic.routes.js";
import { wordRouter } from "./routes/word.routes.js";
import { rapidFireRouter } from "./routes/rapid-fire.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for authentication endpoints: 100 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again after 15 minutes",
    },
  },
});

// Middleware to check database connection readiness for API routes
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api") &&
    req.path !== "/health" &&
    mongoose.connection.readyState !== 1
  ) {
    res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: `MongoDB is not connected at ${config.MONGO_URI}. Please start MongoDB (via Docker, Windows Service, or Atlas) and the server will automatically connect.`,
      },
    });
    return;
  }
  next();
});

// Route registrations
app.use(healthRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/exercises", exerciseRouter);
app.use("/api/profile", profileRouter);
app.use("/api/questions", questionRouter);
app.use("/api/topics", topicRouter);
app.use("/api/words", wordRouter);
app.use("/api/rapid-fire", rapidFireRouter);

// Global error handler
app.use(errorHandler);

let isConnected = false;
let retryTimer: NodeJS.Timeout | null = null;

async function connectWithRetry(): Promise<void> {
  if (isConnected || mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`\n============================================================`);
    console.log(`[Database] Successfully connected to MongoDB at ${config.MONGO_URI}`);
    console.log(`============================================================\n`);
  } catch (err: any) {
    console.warn(`[Database] Cannot connect to MongoDB at ${config.MONGO_URI}`);
    console.warn(`[Database] Run one of the following to start MongoDB:`);
    console.warn(`   • Docker:  docker start prephelp-mongo   (or: docker run -d --name prephelp-mongo -p 27017:27017 mongo:7)`);
    console.warn(`   • Service: net start MongoDB             (in Administrator PowerShell)`);
    console.warn(`   • Cloud:   Set MONGODB_URI in server/.env to your MongoDB Atlas connection string`);
    console.warn(`[Database] Server is running on port ${config.PORT} and will auto-reconnect when MongoDB starts...\n`);

    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectWithRetry();
      }, 5000);
    }
  }
}

/**
 * Initializes HTTP server and database connection with automatic reconnection.
 */
async function startServer(): Promise<void> {
  const server = app.listen(config.PORT, () => {
    console.log(`[Server] PrepHelp server running on port ${config.PORT}`);
    connectWithRetry();
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n[Server Error] Port ${config.PORT} is already in use by another running instance.`
      );
      console.error(
        `To free port ${config.PORT}, run:\n   npx kill-port ${config.PORT}\n`
      );
    } else {
      console.error("[Server Error]", err);
    }
    process.exit(1);
  });
}

// Graceful termination handling
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM signal received: closing MongoDB connection");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Server] SIGINT signal received: closing MongoDB connection");
  await mongoose.connection.close();
  process.exit(0);
});

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app };
