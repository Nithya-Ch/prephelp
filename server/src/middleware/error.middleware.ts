import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import mongoose from "mongoose";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global Express error handling middleware.
 * Maps errors into standard { error: { code, message } } format.
 * Redacts audio data and sensitive properties from server logs.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log message safely without file/audio content
  const sanitizedPath = req.originalUrl || req.path;
  const sanitizedMethod = req.method;

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    console.error(`[Error] ${sanitizedMethod} ${sanitizedPath} - ZodError:`, formattedErrors);
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors[0]?.message || "Validation failed",
        details: formattedErrors,
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    console.error(`[Error] ${sanitizedMethod} ${sanitizedPath} - MulterError:`, err.code);
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: "Uploaded file exceeds maximum allowed file size",
        },
      });
      return;
    }
    res.status(400).json({
      error: {
        code: "UPLOAD_ERROR",
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    console.error(`[Error] ${sanitizedMethod} ${sanitizedPath} - ValidationError:`, err.message);
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    console.error(`[Error] ${sanitizedMethod} ${sanitizedPath} - CastError:`, err.message);
    res.status(400).json({
      error: {
        code: "INVALID_ID",
        message: "Invalid identifier provided",
      },
    });
    return;
  }

  const customError = err as CustomError;
  const statusCode = customError?.statusCode || 500;
  const code = customError?.code || "INTERNAL_SERVER_ERROR";
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "An internal server error occurred"
      : customError?.message || "An unexpected error occurred";

  console.error(
    `[Error] ${sanitizedMethod} ${sanitizedPath} - ${code} (${statusCode}):`,
    customError?.message || err
  );

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
