import { Request, Response, Router } from "express";
import {
  createChatroom,
  deleteChatroom,
  getChatroomDetails,
  getUserChatrooms,
  getUserPinnedChatrooms,
  joinChatroom,
  updateChatroom,
} from "../../controllers/chatroomController.js";
import { reorderMemberChatroom } from "../../controllers/memberController.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", getUserChatrooms);
chatroomRouter.get("/:chatroomId", getChatroomDetails);
chatroomRouter.post("/create", createChatroom);
chatroomRouter.post("/join/:chatroomId", joinChatroom);
chatroomRouter.patch("/:chatroomId", updateChatroom);
chatroomRouter.delete("/:chatroomId", deleteChatroom);
chatroomRouter.get("/pinned/me", getUserPinnedChatrooms);
