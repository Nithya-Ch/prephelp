import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";

/**
 * Middleware that authenticates requests using the 'ph_token' httpOnly cookie.
 * If authentication succeeds, attaches user details ({ userId, email }) to req.user.
 * If invalid or missing, responds with a 401 JSON error.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.ph_token;

  if (!token) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (err) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired authentication token",
      },
    });
  }
}
