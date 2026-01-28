import { Router } from "express";
import { getChatroomPrivacy } from "../../controllers/chatroomController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { chatroomIdSchema } from "../../validators/chatrooms/chatroomValidation.js";

export const publicChatroomRouter = Router();

publicChatroomRouter.get(
  "/:chatroomId",
  validationMiddleware(chatroomIdSchema, (req) => req.params),
  getChatroomPrivacy,
);
