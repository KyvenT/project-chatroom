import { Router } from "express";
import { getJoinInfo } from "../../controllers/chatroomController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { joinKeySchema } from "../../validators/chatrooms/chatroomValidation.js";

export const publicChatroomRouter = Router();

publicChatroomRouter.get(
  "/join/:joinKey",
  validationMiddleware(joinKeySchema, (req) => req.params),
  getJoinInfo,
);
