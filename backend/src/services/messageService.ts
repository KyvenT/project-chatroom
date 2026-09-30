import { MessagePayload } from "../types/payloads.js";
import { retrieveMessageSchema } from "../validators/messages/messageValidation.js";
import z from "zod";
import Prisma from "../prisma.js";
import { isChatroomMember } from "../wss/membership.js";
import { checkAttachment, cleanFileName } from "../lib/attachments.js";

// what a message is sent to clients with
export const messageInclude = {
  senderUser: {
    select: {
      id: true,
      username: true,
    },
  },
  attachment: {
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      size: true,
    },
  },
} as const;

export const getMessages = async (
  userId: string,
  data: z.infer<typeof retrieveMessageSchema>,
): Promise<MessagePayload[]> => {
  const { chatroomId, getBefore, limit } = data;

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
    include: messageInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  const [verify, messages] = await Promise.all([
    verifyPromise,
    messagesPromise,
  ]);

  if (!verify) {
    throw new Error(
      "Attempted retrieving messages from a chatroom that user is not a member of",
    );
  }

  return messages;
};

export class AttachmentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Sends a file as a message from the user to the chatroom
export const createAttachmentMessage = async (
  userId: string,
  chatroomId: string,
  file: { fileName: string; mimeType: string; data: Buffer },
): Promise<MessagePayload> => {
  const check = checkAttachment(file.mimeType, file.data);
  if (!check.ok) throw new AttachmentError(check.status, check.message);

  if (!(await isChatroomMember(userId, chatroomId))) {
    throw new AttachmentError(403, "Not a member of the chatroom");
  }

  return Prisma.message.create({
    data: {
      content: "",
      chatroomId,
      senderUserId: userId,
      attachment: {
        create: {
          fileName: cleanFileName(file.fileName),
          mimeType: file.mimeType,
          size: file.data.length,
          data: new Uint8Array(file.data),
        },
      },
    },
    include: messageInclude,
  });
};

// A file sent in a chatroom, for members of that chatroom only
export const getAttachment = async (userId: string, attachmentId: string) => {
  const attachment = await Prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { message: { select: { chatroomId: true } } },
  });

  if (
    !attachment ||
    !(await isChatroomMember(userId, attachment.message.chatroomId))
  ) {
    // the same answer either way, so ids of other chatrooms' files don't leak
    throw new AttachmentError(404, "File not found");
  }

  return attachment;
};
