import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Signs a JWT token with user credentials and 7-day expiration.
 *
 * @param payload - Object containing userId and email
 * @returns Signed JWT string
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Verifies and decodes a JWT token.
 *
 * @param token - JWT token string
 * @returns Decoded TokenPayload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
}
