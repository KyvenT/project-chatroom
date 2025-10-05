import { Router } from "express";
import { getChatroomPrivacy } from "../../controllers/chatroomController.js";

export const publicChatroomRouter = Router();

publicChatroomRouter.get("/:chatroomId", getChatroomPrivacy);
