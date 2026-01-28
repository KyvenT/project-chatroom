import { Router } from "express";
import {
  authenticateUser,
  createGuest,
  createUser,
} from "../../controllers/authController.js";
import {
  guestSchema,
  userSchema,
} from "../../validators/auth/authValidation.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validationMiddleware(userSchema, (req) => req.body),
  createUser,
);
authRouter.post(
  "/login",
  validationMiddleware(userSchema, (req) => req.body),
  authenticateUser,
);
authRouter.post(
  "/create-guest",
  validationMiddleware(guestSchema, (req) => req.body),
  createGuest,
);
