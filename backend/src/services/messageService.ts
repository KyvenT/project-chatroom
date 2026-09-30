import { MessagePayload } from "../types/payloads.js";
import {
  editMessageSchema,
  retrieveMessageSchema,
} from "../validators/messages/messageValidation.js";
import z from "zod";
import Prisma from "../prisma.js";
import { ChatroomRoles } from "@prisma/client";
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

export class MessageError extends Error {
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
  if (!check.ok) throw new MessageError(check.status, check.message);

  if (!(await isChatroomMember(userId, chatroomId))) {
    throw new MessageError(403, "Not a member of the chatroom");
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
    throw new MessageError(404, "File not found");
  }

  return attachment;
};

// roles that can delete anyone's messages in their chatroom
const MODERATOR_ROLES: ChatroomRoles[] = [
  ChatroomRoles.OWNER,
  ChatroomRoles.ADMIN,
];

const findMessage = async (messageId: string) => {
  const message = await Prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      chatroomId: true,
      senderUserId: true,
      attachment: { select: { id: true } },
    },
  });
  if (!message) throw new MessageError(404, "Message not found");
  return message;
};

// Changes the text of one of the user's own messages
export const editMessage = async (
  userId: string,
  data: z.infer<typeof editMessageSchema>,
): Promise<MessagePayload> => {
  const message = await findMessage(data.messageId);

  if (message.senderUserId !== userId) {
    throw new MessageError(403, "Only the sender can edit a message");
  }
  if (message.attachment) {
    throw new MessageError(400, "Files can't be edited");
  }
  // a sender who has since left the chatroom can't change what it shows
  if (!(await isChatroomMember(userId, message.chatroomId))) {
    throw new MessageError(403, "Not a member of the chatroom");
  }

  return Prisma.message.update({
    where: { id: message.id },
    data: { content: data.content, editedAt: new Date() },
    include: messageInclude,
  });
};

// Deletes a message (and its file) if the user sent it or moderates its
// chatroom; returns where it was so the chatroom can be told
export const deleteMessage = async (userId: string, messageId: string) => {
  const message = await findMessage(messageId);

  const member = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: { chatroomId: message.chatroomId, memberId: userId },
    },
    select: { role: true },
  });
  if (!member) throw new MessageError(403, "Not a member of the chatroom");

  const isSender = message.senderUserId === userId;
  if (!isSender && !MODERATOR_ROLES.includes(member.role)) {
    throw new MessageError(
      403,
      "Only the sender or a chatroom moderator can delete a message",
    );
  }

  await Prisma.message.delete({ where: { id: message.id } });
  return { chatroomId: message.chatroomId, messageId: message.id };
};
