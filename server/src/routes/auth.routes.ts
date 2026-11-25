import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { signupSchema, loginSchema } from "../schemas/auth.schema.js";
import { signToken } from "../lib/jwt.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();

const COOKIE_NAME = "ph_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    domain: config.COOKIE_DOMAIN === "localhost" ? undefined : config.COOKIE_DOMAIN,
    maxAge: SEVEN_DAYS_MS,
  });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    domain: config.COOKIE_DOMAIN === "localhost" ? undefined : config.COOKIE_DOMAIN,
  });
}

authRouter.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = signupSchema.parse(req.body);
      const email = parsed.email.toLowerCase().trim();

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          error: {
            code: "EMAIL_EXISTS",
            message: "A user with this email address already exists",
          },
        });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);
      const user = await User.create({
        name: parsed.name,
        email,
        passwordHash,
      });

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
      });

      setAuthCookie(res, token);

      res.status(201).json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.parse(req.body);
      const email = parsed.email.toLowerCase().trim();

      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        });
        return;
      }

      const isMatch = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        });
        return;
      }

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
      });

      setAuthCookie(res, token);

      res.status(200).json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post("/logout", (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(200).json({ ok: true });
});

authRouter.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.user!.userId).select("-passwordHash");
      if (!user) {
        res.status(404).json({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
        return;
      }

      res.status(200).json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
