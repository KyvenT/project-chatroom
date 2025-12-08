import { ChatroomPrivacy, ChatroomRoles } from "@prisma/client";
import Prisma from "../prisma/prisma.js";
import {
  ChatroomDetailsPayload,
  ChatroomPayload,
  JoinChatroomPayload,
} from "../types/payloads.js";
import {
  chatroomIdSchema,
  chatroomModifyOptionsSchema,
  chatroomSetOptionsSchema,
  swapChatroomIndexesSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import z from "zod";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";

export const getUserChatrooms = async (
  userId: string
): Promise<ChatroomPayload[]> => {
  const chatroomsData = await Prisma.chatroomMember.findMany({
    where: {
      memberId: userId,
    },
    select: {
      chatroomId: true,
      lastViewedAt: true,
      chatroomIndex: true,
      chatroom: {
        select: {
          title: true,
          privacy: true,
          ownerId: true,
        },
      },
    },
    orderBy: {
      chatroomIndex: "asc",
    },
  });

  const chatroomPromises: Promise<ChatroomPayload>[] = chatroomsData.map(
    async (chatroom) => {
      const unreadMessages = await Prisma.message.count({
        where: {
          chatroomId: chatroom.chatroomId,
          createdAt: {
            gt: chatroom.lastViewedAt,
          },
        },
      });
      return { ...chatroom, unreadMessages };
    }
  );

  return await Promise.all(chatroomPromises);
};

export const getChatroomDetails = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>
): Promise<ChatroomDetailsPayload> => {
  const { chatroomId } = data;
  const verifyMembership = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        chatroomId,
        memberId: userId,
      },
    },
  });

  if (!verifyMembership) {
    throw new Error("Not detected as a member of chatroom");
  }

  const chatroomDetails = await Prisma.chatroom.findUnique({
    select: {
      id: true,
      title: true,
      privacy: true,
      ownerId: true,
      createdAt: true,
      owner: {
        select: {
          username: true,
        },
      },
    },
    where: {
      id: chatroomId,
    },
  });

  if (!chatroomDetails) {
    throw new Error("Could not find chatroom details");
  }

  return chatroomDetails;
};

export const createChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomSetOptionsSchema>
) => {
  const { title, privacy } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (verifyUser?.isGuest === true) {
    throw new Error("Only users can create chatrooms");
  }

  if (!title) {
    throw new Error("Tried to create chatroom with empty title");
  }

  const existingChatroomIndex = await Prisma.chatroomMember.findFirst({
    select: {
      chatroomIndex: true,
    },
    where: {
      memberId: userId,
    },
    orderBy: {
      chatroomIndex: "desc",
    },
  });

  const chatroom = await Prisma.chatroom.create({
    data: {
      title,
      ownerId: userId,
      privacy,
    },
  });

  const ownerJoin = (await Prisma.chatroomMember.create({
    data: {
      memberId: userId,
      chatroomId: chatroom.id,
      role: ChatroomRoles.OWNER,
      chatroomIndex: (existingChatroomIndex?.chatroomIndex || 0) + 1,
    },
    omit: {
      lastViewedAt: true,
    },
  })) as JoinChatroomPayload;

  sendUpdateChatrooms(chatroom.id, userId, "JOIN");
};

export const updateChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomModifyOptionsSchema>
) => {
  const { chatroomId, title, privacy } = data;

  const verify = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  if (verify?.ownerId !== userId) {
    throw new Error("Not detected as owner of chatroom");
  }

  if (!title || !privacy) {
    throw new Error("Missing fields");
  }

  const chatroom = await Prisma.chatroom.update({
    where: {
      id: chatroomId,
    },
    data: {
      title,
      privacy,
    },
  });

  const members = await Prisma.chatroomMember.findMany({
    where: {
      chatroomId,
    },
    select: {
      memberId: true,
    },
  });

  members.forEach((member) => {
    sendUpdateChatrooms(chatroomId, member.memberId, "UPDATE");
  });
};

export const deleteChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>
) => {
  const { chatroomId } = data;
  const verify = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  if (verify?.ownerId !== userId) {
    throw new Error("Not detected as owner of chatroom");
  }

  const members = await Prisma.chatroomMember.findMany({
    where: {
      chatroomId,
    },
    select: {
      memberId: true,
    },
  });

  await Prisma.chatroom.delete({
    where: {
      id: chatroomId,
    },
  });

  members.forEach((member) => {
    sendUpdateChatrooms(chatroomId, member.memberId, "LEAVE");
  });
};

export const getChatroomPrivacy = async (
  data: z.infer<typeof chatroomIdSchema>
): Promise<ChatroomPrivacy> => {
  const { chatroomId } = data;

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
    select: {
      privacy: true,
    },
  });

  if (!chatroom) {
    throw new Error("Could not find chatroom privacy");
  }

  return chatroom.privacy;
};

export const swapChatroomIndexes = async (
  userId: string,
  data: z.infer<typeof swapChatroomIndexesSchema>
) => {
  const { firstChatroomId, secondChatroomId } = data;

  const firstChatroomIndexPromise = Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        chatroomId: firstChatroomId,
        memberId: userId,
      },
    },
    select: {
      chatroomIndex: true,
    },
  });

  const secondChatroomIndexPromise = Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        chatroomId: secondChatroomId,
        memberId: userId,
      },
    },
    select: {
      chatroomIndex: true,
    },
  });

  const [firstChatroomIndex, secondChatroomIndex] = await Promise.all([
    firstChatroomIndexPromise,
    secondChatroomIndexPromise,
  ]);

  if (!firstChatroomIndex || !secondChatroomIndex) {
    throw new Error("Chatroom(s) not found");
  }

  const firstChatroomUpdate = Prisma.chatroomMember.update({
    where: {
      chatroomId_memberId: {
        chatroomId: firstChatroomId,
        memberId: userId,
      },
    },
    data: {
      chatroomIndex: secondChatroomIndex.chatroomIndex,
    },
  });

  const secondChatroomUpdate = Prisma.chatroomMember.update({
    where: {
      chatroomId_memberId: {
        chatroomId: firstChatroomId,
        memberId: userId,
      },
    },
    data: {
      chatroomIndex: firstChatroomIndex.chatroomIndex,
    },
  });

  await Promise.all([firstChatroomUpdate, secondChatroomUpdate]);
};
