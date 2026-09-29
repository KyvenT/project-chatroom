import { Request, Response } from "express";
import * as pinnedGroupService from "../services/pinnedGroupsService.js";

const pinErrorStatus = (message: string) => {
  switch (message) {
    case "Pinned group not found":
      return 404;
    case "Not detected as owner of pin group":
    case "Attempted pinning a chatroom that user is not a member of":
    case "Only users can create pinned groups":
    case "Only users can edit pinned groups":
      return 403;
    default:
      return 500;
  }
};

export const getUserPinnedGroups = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res
      .status(401)
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
  const { userId, data } = req;

  if (!userId) {
    res
      .status(401)
      .json({ message: "Must be signed in to create a pinned group" });
    return;
  }

  try {
    const pinnedGroup = await pinnedGroupService.createPinnedGroup(
      userId,
      data,
    );
    res.status(201).json(pinnedGroup);
  } catch (err: any) {
    console.error("create pinned group error");
    res.status(pinErrorStatus(err.message)).json({ message: err.message });
  }
};

export const editPinnedGroup = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res
      .status(401)
      .json({ message: "Must be signed in to edit a pinned group" });
    return;
  }

  try {
    await pinnedGroupService.editPinnedGroup(userId, data);
    res.status(200).json({ message: "Pinned group edited" });
  } catch (err: any) {
    console.error("edit pinned group error");
    res.status(pinErrorStatus(err.message)).json({ message: err.message });
  }
};

export const pinMemberChatroom = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "must be signed in to pin a chatroom" });
    return;
  }

  try {
    await pinnedGroupService.pinChatroom(userId, data);
    res.status(200).json({ message: "chatroom pin updated" });
    console.log("chatroom pin updated");
  } catch (err: any) {
    console.error("Chatroom pin error", err.message);
    res.status(pinErrorStatus(err.message)).json({ message: err.message });
  }
};

export const deletePinnedGroup = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res
      .status(401)
      .json({ message: "Must be signed in to delete a pinned group" });
    return;
  }

  try {
    await pinnedGroupService.deletePinnedGroup(userId, data);
    res.status(200).json({ message: "Pinned group deleted" });
  } catch (err: any) {
    console.error("delete pinned group error", err.message);
    res.status(pinErrorStatus(err.message)).json({ message: err.message });
  }
};

export const swapPinnedChatrooms = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res
      .status(401)
      .json({ message: "must be signed in to reorder pinned chatrooms" });
    return;
  }

  try {
    await pinnedGroupService.swapPinnedChatrooms(userId, data);
    res.status(200).json({ message: "Pinned chatrooms reordered" });
    console.log("Pinned chatrooms reordered");
  } catch (err: any) {
    console.error("Pinned chatroom reorder error", err.message);
    res.status(500).json({ message: err.message });
  }
};
