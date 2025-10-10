import { Request, Response, Router } from "express";
import {
  getChatroomMembers,
  pinMemberChatroom,
  removeMemberFromChatroom,
  reorderMemberChatroom,
} from "../../controllers/memberController.js";
import { joinChatroom } from "../../controllers/memberController.js";

export const membersRouter = Router();

membersRouter.get("/:chatroomId", getChatroomMembers);
membersRouter.delete("/:chatroomId", removeMemberFromChatroom);
membersRouter.patch("/:chatroomId/order", reorderMemberChatroom);
membersRouter.patch("/:chatroomId/pin", pinMemberChatroom);
membersRouter.post("/:chatroomId", joinChatroom);
