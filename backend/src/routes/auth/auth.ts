import { Router } from "express";
import {
  authenticateUser,
  createGuest,
  createUser,
} from "../../controllers/authController.js";

export const authRouter = Router();

authRouter.post("/register", createUser);
authRouter.post("/login", authenticateUser);
authRouter.post("/create-guest", createGuest);
