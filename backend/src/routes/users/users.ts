import { Router } from "express";
import {
  getUserDetails,
  updateUserStatus,
} from "../../controllers/userController.js";

export const usersRouter = Router();

usersRouter.get("/me", getUserDetails);
usersRouter.patch("/me", updateUserStatus);
