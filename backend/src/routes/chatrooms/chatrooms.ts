import { Router } from "express";
import {
  createChatroom,
  deleteChatroom,
  getChatroomDetails,
  getUserChatrooms,
  getUserPinnedChatrooms,
  updateChatroom,
} from "../../controllers/chatroomController.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", getUserChatrooms);
chatroomRouter.get("/:chatroomId", getChatroomDetails);
chatroomRouter.post("/create", createChatroom);
chatroomRouter.patch("/:chatroomId", updateChatroom);
chatroomRouter.delete("/:chatroomId", deleteChatroom);
chatroomRouter.get("/pinned/me", getUserPinnedChatrooms);
