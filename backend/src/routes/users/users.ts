import { Router } from "express";
import {
  getUserDetails,
  updateUserStatus,
} from "../../controllers/userController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { updateUserStatusSchema } from "../../validators/users/userValidation.js";

export const usersRouter = Router();

usersRouter.get("/me", getUserDetails);
usersRouter.patch(
  "/me",
  validationMiddleware(updateUserStatusSchema, (req) => req.body),
  updateUserStatus,
);
