import { Request, Response } from "express";
import * as avatarService from "../services/avatarService.js";
import { parseMimeType } from "../lib/attachments.js";
import { sendAvatarUpdate } from "../wss/outgoing-messages/avatar-update.js";

const sendError = (res: Response, err: any) => {
  if (err instanceof avatarService.AvatarError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: err.message });
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const { userId, isGuest } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in" });
    return;
  }

  try {
    const avatarUpdatedAt = await avatarService.setAvatar(
      userId,
      !!isGuest,
      parseMimeType(req.headers["content-type"]),
      Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0),
    );
    sendAvatarUpdate(userId, avatarUpdatedAt);
    res.status(200).json({ avatarUpdatedAt });
  } catch (err: any) {
    sendError(res, err);
  }
};

export const deleteAvatar = async (req: Request, res: Response) => {
  const { userId } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in" });
    return;
  }

  try {
    await avatarService.removeAvatar(userId);
    sendAvatarUpdate(userId, null);
    res.status(200).json({ avatarUpdatedAt: null });
  } catch (err: any) {
    sendError(res, err);
  }
};

// Anyone can get a picture by its user's id, so it works in an <img>. Its URL
// carries the version (?v=), so it can be cached for good.
export const getAvatar = async (req: Request, res: Response) => {
  try {
    const avatar = await avatarService.getAvatar(req.data.userId);
    res.setHeader("Content-Type", avatar.mimeType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    // pictures can be shown by the app while it runs on another origin in
    // development
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).send(Buffer.from(avatar.data));
  } catch (err: any) {
    sendError(res, err);
  }
};
