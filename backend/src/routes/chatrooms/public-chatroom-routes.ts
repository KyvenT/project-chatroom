import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";
import { chatroomIdSchema } from "../../validators/chatrooms/chatroomValidation.js";
import { validate } from "../../validators/validate.js";

export const publicChatroomRouter = Router();

publicChatroomRouter.get(
  "/:chatroomId",
  async (req: Request, res: Response) => {
    const data = validate(chatroomIdSchema, req.params, res);
    if (!data) return;
    const { chatroomId } = data;

    try {
      const privacy = await Prisma.chatroom.findUnique({
        where: {
          id: chatroomId,
        },
        select: {
          privacy: true,
        },
      });

      res.status(200).json(privacy);
    } catch (err) {
      console.error("couldnt fetch chatroom privacy", err);
      res.status(500).json({ message: "couldnt fetch chatroom privacy" });
    }
  }
);
