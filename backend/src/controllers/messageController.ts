import { validate } from "../validators/validate.js";
import { retrieveMessageSchema } from "../validators/messages/messageValidation.js";
import { Request, Response } from "express";
import * as messageService from "../services/messageService.js";

export const getMessages = async (req: Request, res: Response) => {
  const data = validate(retrieveMessageSchema, req.params, res);
  if (!data) return;
  const userId = req.userId;

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
