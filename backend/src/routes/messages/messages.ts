import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";
import { MessagePayload } from "../../types/payloads.js";
import { validate } from "../../validators/validate.js";
import { retrieveMessageSchema } from "../../validators/messages/messageValidation.js";

export const messagesRouter = Router();

messagesRouter.get(
  "/:chatroomId/:getBefore",
  async (req: Request, res: Response) => {
    const data = validate(retrieveMessageSchema, req.params, res);
    if (!data) return;
    const { chatroomId, getBefore } = data;
    const userId = req.userId;

    if (!userId) {
      res.status(400).json({ error: "Must be signed in to get messages" });
      return;
    }
    console.log("get messages before " + getBefore + " for " + userId);

    try {
      const verifyPromise = Prisma.chatroomMember.findUnique({
        where: {
          chatroomId_memberId: {
            memberId: userId,
            chatroomId,
          },
        },
      });

      const messagesPromise = Prisma.message.findMany({
        where: {
          chatroomId,
          createdAt: {
            lt: getBefore,
          },
        },
        include: {
          senderUser: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 25,
      }) as Promise<MessagePayload[]>;

      const [verify, messages] = await Promise.all([
        verifyPromise,
        messagesPromise,
      ]);

      if (!verify) {
        console.error(
          "attempted retrieving messages from a chatroom that user is not a member of"
        );
        res
          .status(400)
          .json({ error: "Not detected as a member of that chatroom" });
        return;
      }

      res.status(201).json(messages);
      console.log("messages retrieved");
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Server error occurred while retrieving messages" });
    }
  }
);
