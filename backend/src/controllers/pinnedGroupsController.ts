import { Request, Response } from "express";
import * as pinnedGroupService from "../services/pinnedGroupsService.js";
import { validate } from "../validators/validate.js";
import {
  chatroomPinSchema,
  setPinnedGroupSchema,
} from "../validators/pinned-groups/pinnedGroupsValidation.js";

export const getUserPinnedGroups = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res
      .status(500)
      .json({ message: "Must be signed in to get pinned chatrooms" });
    return;
  }

  try {
    const chatrooms = await pinnedGroupService.getPinnedGroups(userId);
    res.status(200).json(chatrooms);
  } catch (err: any) {
    console.error("retrieving pinned chatrooms error");
    res.status(500).json({ message: err.message });
  }
};

export const createPinnedGroup = async (req: Request, res: Response) => {
  const data = validate(setPinnedGroupSchema, req.body, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res
      .status(500)
      .json({ message: "Must be signed in to create a pinned group" });
    return;
  }

  try {
    await pinnedGroupService.createPinnedGroup(userId, data);
    res.status(200).json({ message: "Pinned group created" });
  } catch (err: any) {
    console.error("create pinned group error");
    res.status(500).json({ message: err.message });
  }
};

export const pinMemberChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomPinSchema, { ...req.params, ...req.body }, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(500).json({ message: "must be signed in to pin a chatroom" });
    return;
  }

  try {
    await pinnedGroupService.pinChatroom(userId, data);
    res.status(200).json({ message: "chatroom pin updated" });
    console.log("chatroom pin updated");
  } catch (err: any) {
    console.error("Chatroom pin error", err.message);
    res.status(500).json({ message: err.message });
  }
};
