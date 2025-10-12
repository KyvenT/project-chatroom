import {
  chatroomModifyIndexSchema,
  chatroomIdSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import { validate } from "../validators/validate.js";
import { Request, Response } from "express";
import { memberLeaveSchema } from "../validators/members/memberValidation.js";
import * as membersService from "../services/memberService.js";

export const reorderMemberChatroom = async (req: Request, res: Response) => {
  const data = validate(
    chatroomModifyIndexSchema,
    { ...req.params, ...req.body },
    res
  );
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res
      .status(500)
      .json({ message: "must be signed in to reorder a chatroom" });
    return;
  }

  try {
    await membersService.reorderChatrooms(userId, data);
    res.status(200).json({ message: "chatrooms reordered" });
    console.log("chatrooms reordered");
  } catch (err: any) {
    console.error("Chatroom reorder error", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const getChatroomMembers = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to get members list" });
    return;
  }

  try {
    const members = await membersService.getChatroomMembers(userId, data);
    res.status(201).json(members);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const removeMemberFromChatroom = async (req: Request, res: Response) => {
  const data = validate(memberLeaveSchema, { ...req.params, ...req.body }, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to leave chatroom" });
    return;
  }

  try {
    await membersService.removeMemberFromChatroom(userId, data);
    res.status(201).json({ message: "Member left successfully" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const joinChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to join" });
    return;
  }

  try {
    await membersService.joinChatroom(userId, data);
    res.status(200).json({ message: "Chatroom joined" });
  } catch (error: any) {
    console.error("Chatroom join error:", error);
    res.status(500).json({ message: error.message });
  }
};
