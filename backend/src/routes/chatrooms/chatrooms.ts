import { Router } from "express";
import {
  createChatroom,
  deleteChatroom,
  getChatroomDetails,
  getUserChatrooms,
  swapChatroomIndexes,
  updateChatroom,
} from "../../controllers/chatroomController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  chatroomIdSchema,
  chatroomModifyOptionsSchema,
  chatroomSetOptionsSchema,
  swapChatroomIndexesSchema,
} from "../../validators/chatrooms/chatroomValidation.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", getUserChatrooms);
chatroomRouter.post(
  "/create",
  validationMiddleware(chatroomSetOptionsSchema, (req) => req.body),
  createChatroom,
);
chatroomRouter.patch(
  "/reorder",
  validationMiddleware(swapChatroomIndexesSchema, (req) => req.body),
  swapChatroomIndexes,
);
chatroomRouter.get(
  "/:chatroomId",
  validationMiddleware(chatroomIdSchema, (req) => req.params),
  getChatroomDetails,
);
chatroomRouter.patch(
  "/:chatroomId",
  validationMiddleware(chatroomModifyOptionsSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  updateChatroom,
);
chatroomRouter.delete(
  "/:chatroomId",
  validationMiddleware(chatroomIdSchema, (req) => req.params),
  deleteChatroom,
);
