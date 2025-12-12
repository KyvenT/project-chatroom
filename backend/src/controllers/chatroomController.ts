import {
  chatroomIdSchema,
  chatroomModifyOptionsSchema,
  chatroomSetOptionsSchema,
  swapChatroomIndexesSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import { validate } from "../validators/validate.js";
import { Request, Response } from "express";
import * as chatroomService from "../services/chatroomService.js";

export const getUserChatrooms = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to get chatrooms" });
    return;
  }

  try {
    const chatrooms = await chatroomService.getUserChatrooms(userId);
    res.status(201).json(chatrooms);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error occurred while fetching chatrooms" });
  }
};

export const getChatroomDetails = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;

  const userId = req.userId;

  if (!userId) {
    res
      .status(400)
      .json({ message: "Must be signed in to get chatroom details" });
    return;
  }

  try {
    const chatroomDetails = await chatroomService.getChatroomDetails(
      userId,
      data
    );
    res.status(200).json(chatroomDetails);
  } catch (err: any) {
    console.error("could not fetch chatroom details", err);
    res.status(400).json({ message: err.message });
  }
};

export const createChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomSetOptionsSchema, req.body, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to create a chatroom" });
    return;
  }

  try {
    await chatroomService.createChatroom(userId, data);
    res.status(201).json({ message: "Chatroom created" });
  } catch (error: any) {
    console.error("Chatroom creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateChatroom = async (req: Request, res: Response) => {
  const data = validate(
    chatroomModifyOptionsSchema,
    { ...req.params, ...req.body },
    res
  );
  if (!data) return;

  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to update a chatroom" });
    return;
  }

  try {
    await chatroomService.updateChatroom(userId, data);
    res.status(200).json({ message: "Chatroom updated" });
    return;
  } catch (err: any) {
    console.error("Chatroom rename error");
    res.status(500).json({ message: err.message });
  }
};

export const deleteChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to delete a chatroom" });
    return;
  }

  try {
    await chatroomService.deleteChatroom(userId, data);
    res.status(200).json({ message: "Chatroom deleted" });
  } catch (err: any) {
    console.error("Chatroom delete error");
    res.status(500).json({ message: err.message });
  }
};

export const getChatroomPrivacy = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;

  try {
    const privacy = await chatroomService.getChatroomPrivacy(data);
    res.status(200).json({ privacy });
  } catch (err) {
    console.error("couldnt fetch chatroom privacy", err);
    res.status(500).json({ message: "couldnt fetch chatroom privacy" });
  }
};

export const swapChatroomIndexes = async (req: Request, res: Response) => {
  const data = validate(swapChatroomIndexesSchema, req.body, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to reorder chatrooms" });
    return;
  }

  try {
    await chatroomService.swapChatroomIndexes(userId, data);
    res.status(200).json({ message: "Chatrooms reordered successfully" });
  } catch (err) {
    console.error("couldn't swap chatrooms", err);
    res.status(500).json({ message: "Failed to reorder chatrooms" });
  }
};
