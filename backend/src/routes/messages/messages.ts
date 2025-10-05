import { Router } from "express";
import { getMessages } from "../../controllers/messageController.js";

export const messagesRouter = Router();

messagesRouter.get("/:chatroomId/:getBefore", getMessages);
