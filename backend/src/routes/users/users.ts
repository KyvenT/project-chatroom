import { Router } from "express";
import {
  getUserDetails,
  updateUserStatus,
} from "../../controllers/userController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  deleteAvatar,
  uploadAvatar,
} from "../../controllers/avatarController.js";
import { uploadRateLimitMiddleware } from "../../middleware/rateLimitMiddleware.js";
import { readRawBody } from "../../middleware/readRawBody.js";
import { MAX_AVATAR_SIZE } from "../../lib/avatars.js";
import { updateUserStatusSchema } from "../../validators/users/userValidation.js";

export const usersRouter = Router();

usersRouter.get("/me", getUserDetails);
usersRouter.patch(
  "/me",
  validationMiddleware(updateUserStatusSchema, (req) => req.body),
  updateUserStatus,
);

// the picture is the body, sent with its MIME type as the Content-Type
usersRouter.put(
  "/me/avatar",
  uploadRateLimitMiddleware,
  readRawBody(MAX_AVATAR_SIZE),
  uploadAvatar,
);
usersRouter.delete("/me/avatar", deleteAvatar);
