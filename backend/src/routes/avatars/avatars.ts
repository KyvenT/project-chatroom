import { Router } from "express";
import z from "zod";
import { getAvatar } from "../../controllers/avatarController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";

// Profile pictures, which pages load as plain images (without a token)
export const avatarsRouter = Router();

avatarsRouter.get(
  "/:userId",
  validationMiddleware(z.object({ userId: z.uuid() }), (req) => req.params),
  getAvatar,
);
