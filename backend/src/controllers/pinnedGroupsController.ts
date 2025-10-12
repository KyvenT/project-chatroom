import { Request, Response } from "express";
import * as pinnedGroupService from "../services/pinnedGroupsService.js";

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
