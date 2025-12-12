import { Router } from "express";
import {
  getChatroomMembers,
  getMemberDetails,
  removeMemberFromChatroom,
  reorderMemberChatroom,
} from "../../controllers/memberController.js";
import { joinChatroom } from "../../controllers/memberController.js";

export const membersRouter = Router();

membersRouter.get("/:chatroomId", getChatroomMembers);
membersRouter.delete("/:chatroomId", removeMemberFromChatroom);
membersRouter.post("/:chatroomId", joinChatroom);
membersRouter.patch("/:chatroomId/order", reorderMemberChatroom);
membersRouter.get("/:chatroomId/:memberId", getMemberDetails);
