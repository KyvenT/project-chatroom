import { Router } from "express";
import {
  createChatroom,
  deleteChatroom,
  getChatroomDetails,
  getUserChatrooms,
  swapChatroomIndexes,
  updateChatroom,
} from "../../controllers/chatroomController.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", getUserChatrooms);
chatroomRouter.post("/create", createChatroom);
chatroomRouter.patch("/reorder", swapChatroomIndexes);
chatroomRouter.get("/:chatroomId", getChatroomDetails);
chatroomRouter.patch("/:chatroomId", updateChatroom);
chatroomRouter.delete("/:chatroomId", deleteChatroom);
