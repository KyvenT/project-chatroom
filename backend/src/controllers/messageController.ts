import { Request, Response } from "express";
import * as messageService from "../services/messageService.js";
import { sendChatMessage } from "../wss/outgoing-messages/chat-message.js";
import {
  sendMessageDelete,
  sendMessageEdit,
} from "../wss/outgoing-messages/message-changes.js";
import { contentDisposition, parseMimeType } from "../lib/attachments.js";

export const getMessages = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to get messages" });
    return;
  }

  try {
    const messages = await messageService.getMessages(userId, data);
    res.status(201).json(messages);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const uploadAttachment = async (req: Request, res: Response) => {
  const { userId, isGuest, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to send files" });
    return;
  }
  // guest accounts are free to make, so they can't store files
  if (isGuest) {
    res.status(403).json({ message: "Only users can send files" });
    return;
  }

  try {
    const message = await messageService.createAttachmentMessage(
      userId,
      data.chatroomId,
      {
        fileName: data.name,
        mimeType: parseMimeType(req.headers["content-type"]),
        data: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0),
      },
    );
    sendChatMessage(message);
    res.status(201).json(message);
  } catch (err: any) {
    if (err instanceof messageService.MessageError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const getAttachment = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to get files" });
    return;
  }

  try {
    const attachment = await messageService.getAttachment(
      userId,
      data.attachmentId,
    );
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      contentDisposition(attachment.fileName, attachment.mimeType),
    );
    // never run as a page, even if opened directly
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Cache-Control", "private, max-age=86400, immutable");
    res.status(200).send(Buffer.from(attachment.data));
  } catch (err: any) {
    if (err instanceof messageService.MessageError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const editMessage = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to edit messages" });
    return;
  }

  try {
    const message = await messageService.editMessage(userId, data);
    sendMessageEdit(message);
    res.status(200).json(message);
  } catch (err: any) {
    if (err instanceof messageService.MessageError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to delete messages" });
    return;
  }

  try {
    const deleted = await messageService.deleteMessage(userId, data.messageId);
    sendMessageDelete(deleted.chatroomId, deleted.messageId);
    res.status(200).json(deleted);
  } catch (err: any) {
    if (err instanceof messageService.MessageError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
