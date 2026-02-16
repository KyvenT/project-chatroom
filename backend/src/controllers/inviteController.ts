import { Request, Response } from "express";
import * as inviteService from "../services/inviteService.js";

export const getUserInvites = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to get invites" });
    return;
  }
  console.log("get invites for " + userId);

  try {
    const invites = await inviteService.getUserInvites(userId);
    res.status(201).json(invites);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const createInvite = async (req: Request, res: Response) => {
  const { userId: senderId, data } = req;

  if (!senderId) {
    res.status(400).json({ message: "Must be signed in to send invite" });
    return;
  }

  try {
    await inviteService.createInvite(senderId, data);
    res.status(201).json({ message: "Invite sent successfully" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const respondToInvite = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to respond to invite" });
    return;
  }

  try {
    await inviteService.respondToInvite(userId, data);
    res.status(200).json("Invite response successful");
  } catch (err: any) {
    console.error("invite accept error", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteInvite = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to delete invite" });
    return;
  }

  try {
    await inviteService.deleteInvite(userId, data);
    res.status(200).json({ message: "Invite deleted" });
  } catch (err: any) {
    console.error("Invite delete error");
    res.status(500).json({ message: err.message });
  }
};

export const getChatroomInvites = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res
      .status(400)
      .json({ message: "Must be signed in to get chatroom invites" });
    return;
  }

  try {
    const invites = await inviteService.getChatroomInvites(userId, data);
    res.status(200).json(invites);
  } catch (err: any) {
    console.error("invites fetch error");
    res.status(500).json({
      message: err.message,
    });
  }
};
