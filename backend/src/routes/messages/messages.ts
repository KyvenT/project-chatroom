import { Router } from "express";
import { getMessages } from "../../controllers/messageController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { retrieveMessageSchema } from "../../validators/messages/messageValidation.js";

export const messagesRouter = Router();

messagesRouter.get(
  "/:chatroomId",
  validationMiddleware(retrieveMessageSchema, (req) => ({
    ...req.params,
    ...req.query,
  })),
  getMessages,
);
