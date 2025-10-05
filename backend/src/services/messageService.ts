import { MessagePayload } from "../types/payloads.js";
import { retrieveMessageSchema } from "../validators/messages/messageValidation.js";
import z from "zod";
import Prisma from "../prisma/prisma.js";

export const getMessages = async (
  userId: string,
  data: z.infer<typeof retrieveMessageSchema>
): Promise<MessagePayload[]> => {
  const { chatroomId, getBefore } = data;

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
  });

  const [verify, messages] = await Promise.all([
    verifyPromise,
    messagesPromise,
  ]);

  if (!verify) {
    throw new Error(
      "Attempted retrieving messages from a chatroom that user is not a member of"
    );
  }

  return messages;
};
