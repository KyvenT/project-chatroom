import { Router } from "express";
import {
  createChatroom,
  deleteChatroom,
  getChatroomDetails,
  getUserChatrooms,
  updateChatroom,
} from "../../controllers/chatroomController.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", getUserChatrooms);
chatroomRouter.get("/:chatroomId", getChatroomDetails);
chatroomRouter.post("/create", createChatroom);
chatroomRouter.patch("/:chatroomId", updateChatroom);
chatroomRouter.delete("/:chatroomId", deleteChatroom);
