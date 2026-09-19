import { ChatroomPrivacy, ChatroomRoles } from "@prisma/client";
import Prisma from "../prisma.js";
import {
  ChatroomDetailsPayload,
  ChatroomPayload,
  JoinChatroomPayload,
  JoinInfoPayload,
} from "../types/payloads.js";
import {
  chatroomIdSchema,
  joinKeySchema,
  chatroomModifyOptionsSchema,
  chatroomSetOptionsSchema,
  swapChatroomIndexesSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import z from "zod";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import { generateJoinKey } from "../lib/joinKey.js";

export const getUserChatrooms = async (
  userId: string,
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
    },
  );

  return await Promise.all(chatroomPromises);
};

export const getChatroomDetails = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>,
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
      joinKey: true,
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

  // only the owner gets to see (and share) the join key
  const { joinKey, ...details } = chatroomDetails;
  return chatroomDetails.ownerId === userId
    ? { ...details, joinKey }
    : details;
};

export const createChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomSetOptionsSchema>,
) => {
  const { title, privacy } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!verifyUser) {
    throw new Error("User not found");
  }

  if (verifyUser?.isGuest === true) {
    throw new Error("Only users can create chatrooms");
  }

  if (!title || !privacy) {
    throw new Error("Missing chatroom title or privacy");
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
      joinKey: generateJoinKey(),
    },
  });

  await Prisma.chatroomMember.create({
    data: {
      memberId: userId,
      chatroomId: chatroom.id,
      role: ChatroomRoles.OWNER,
      chatroomIndex: (existingChatroomIndex?.chatroomIndex || 0) + 1,
    },
  });

  sendUpdateChatrooms(chatroom.id, userId, "JOIN");
};

export const updateChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomModifyOptionsSchema>,
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
  data: z.infer<typeof chatroomIdSchema>,
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

export const getJoinInfo = async (
  data: z.infer<typeof joinKeySchema>,
): Promise<JoinInfoPayload> => {
  const { joinKey } = data;

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      joinKey,
    },
    select: {
      id: true,
      title: true,
      privacy: true,
    },
  });

  if (!chatroom) {
    throw new Error("Invalid or expired join link");
  }

  return {
    chatroomId: chatroom.id,
    title: chatroom.title,
    privacy: chatroom.privacy,
  };
};

export const regenerateJoinKey = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>,
): Promise<string> => {
  const { chatroomId } = data;

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  if (chatroom?.ownerId !== userId) {
    throw new Error("Not detected as owner of chatroom");
  }

  const updated = await Prisma.chatroom.update({
    where: {
      id: chatroomId,
    },
    data: {
      joinKey: generateJoinKey(),
    },
    select: {
      joinKey: true,
    },
  });

  return updated.joinKey;
};

export const swapChatroomIndexes = async (
  userId: string,
  data: z.infer<typeof swapChatroomIndexesSchema>,
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

  const chatroomUpdate = await Prisma.$transaction([
    Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId: secondChatroomId,
          memberId: userId,
        },
      },
      data: {
        chatroomIndex: -1,
      },
    }),
    Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId: firstChatroomId,
          memberId: userId,
        },
      },
      data: {
        chatroomIndex: secondChatroomIndex.chatroomIndex,
      },
    }),
    Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId: secondChatroomId,
          memberId: userId,
        },
      },
      data: {
        chatroomIndex: firstChatroomIndex.chatroomIndex,
      },
    }),
  ]);
};
