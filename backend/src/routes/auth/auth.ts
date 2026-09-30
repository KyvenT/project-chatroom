import { Router } from "express";
import {
  authenticateUser,
  createGuest,
  createUser,
  logoutUser,
  useRefreshToken,
} from "../../controllers/authController.js";
import {
  guestSchema,
  refreshTokenSchema,
  userSchema,
} from "../../validators/auth/authValidation.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { authRateLimitMiddleware } from "../../middleware/rateLimitMiddleware.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimitMiddleware,
  validationMiddleware(userSchema, (req) => req.body),
  createUser,
);
authRouter.post(
  "/login",
  authRateLimitMiddleware,
  validationMiddleware(userSchema, (req) => req.body),
  authenticateUser,
);
authRouter.post(
  "/create-guest",
  authRateLimitMiddleware,
  validationMiddleware(guestSchema, (req) => req.body),
  createGuest,
);
authRouter.post(
  "/logout",
  validationMiddleware(refreshTokenSchema, (req) => req.cookies),
  logoutUser,
);
authRouter.post(
  "/refresh",
  validationMiddleware(refreshTokenSchema, (req) => req.cookies),
  useRefreshToken,
);
