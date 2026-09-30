import Prisma from "../prisma.js";
import z from "zod";
import {
  chatroomIdSchema,
  chatroomModifyIndexSchema,
  joinKeySchema,
} from "../validators/chatrooms/chatroomValidation.js";
import { ChatroomPrivacy } from "@prisma/client";
import {
  ChatroomMemberDetailsPayload,
  MembersPayload,
  UserDetailsPayload,
} from "../types/payloads.js";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import { chatroomMemberSchema } from "../validators/members/memberValidation.js";
import {
  userActiveChatroomMap,
  userWatchedChatroomsMap,
} from "../lib/socketMaps.js";

export const joinChatroom = async (
  userId: string,
  data: z.infer<typeof joinKeySchema>,
): Promise<string> => {
  const { joinKey } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      joinKey,
    },
  });

  if (!chatroom) {
    throw new Error("Invalid or expired join link");
  }

  if (verifyUser?.isGuest === true) {
    if (chatroom.privacy !== ChatroomPrivacy.PUBLIC) {
      throw new Error("Only users can join this chatroom");
    }
  } else if (
    chatroom.privacy !== ChatroomPrivacy.JOINABLE &&
    chatroom.privacy !== ChatroomPrivacy.PUBLIC
  ) {
    throw new Error("Joining this chatroom requires an invite");
  }

  const existingMembership = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        chatroomId: chatroom.id,
        memberId: userId,
      },
    },
  });

  if (existingMembership) {
    return chatroom.id;
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

  try {
    await Prisma.chatroomMember.create({
      data: {
        memberId: userId,
        chatroomId: chatroom.id,
        chatroomIndex: (existingChatroomIndex?.chatroomIndex || 0) + 1,
      },
    });
  } catch (error: any) {
    // a concurrent join request already created the membership
    if (error.code === "P2002") {
      return chatroom.id;
    }
    throw error;
  }

  sendUpdateChatrooms(chatroom.id, userId, "JOIN");

  return chatroom.id;
};

export const reorderChatrooms = async (
  userId: string,
  data: z.infer<typeof chatroomModifyIndexSchema>,
) => {
  const { chatroomId, newIndex } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (verifyUser?.isGuest === true) {
    throw new Error("Must be a user to pin chatrooms");
  }

  const checkNewIndex = await Prisma.chatroomMember.findUnique({
    where: {
      memberId_chatroomIndex: {
        memberId: userId,
        chatroomIndex: newIndex,
      },
    },
    select: {
      chatroomIndex: true,
    },
  });

  if (!checkNewIndex) {
    await Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId,
          memberId: userId,
        },
      },
      data: {
        chatroomIndex: newIndex,
      },
    });
  } else {
    const checkPrevIndex = await Prisma.chatroomMember.findUnique({
      where: {
        chatroomId_memberId: {
          memberId: userId,
          chatroomId,
        },
      },
      select: {
        chatroomIndex: true,
      },
    });

    const swap = await Prisma.chatroomMember.update({
      where: {
        memberId_chatroomIndex: {
          memberId: userId,
          chatroomIndex: newIndex,
        },
      },
      data: {
        chatroomIndex: 0,
      },
    });

    const swapNew = Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId,
          memberId: userId,
        },
      },
      data: {
        chatroomIndex: newIndex,
      },
    });

    const swapOld = Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId: swap.chatroomId,
          memberId: userId,
        },
      },
      data: {
        chatroomIndex: checkPrevIndex?.chatroomIndex,
      },
    });

    await Promise.all([swapNew, swapOld]);
  }
};

export const getChatroomMembers = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>,
): Promise<MembersPayload[]> => {
  const { chatroomId } = data;

  const verify = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        memberId: userId,
        chatroomId,
      },
    },
  });

  if (!verify) {
    throw new Error(
      "Attempted retrieving member list from a chatroom that user is not a member of",
    );
  }

  const membersPromise = Prisma.chatroomMember.findMany({
    where: {
      chatroomId,
    },
    include: {
      member: {
        select: {
          username: true,
          status: true,
        },
      },
    },
    omit: {
      chatroomId: true,
      joinedAt: true,
      chatroomIndex: true,
      lastViewedAt: true,
    },
    orderBy: {
      member: {
        username: "asc",
      },
    },
  });
  const [members] = await Promise.all([membersPromise]);

  return members;
};

export const removeMemberFromChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomMemberSchema>,
) => {
  const { chatroomId, memberId } = data;

  const chatroom = await Prisma.chatroom.findUnique({
    where: { id: chatroomId },
    select: { ownerId: true },
  });

  if (!chatroom) {
    throw new Error("Chatroom not found");
  }

  const ownerId = chatroom.ownerId;

  // the owner can't leave (they delete the chatroom instead) or be removed;
  // anyone else can leave, and the owner can remove them
  if (memberId === ownerId) {
    throw new Error("The owner can't leave or be removed from their chatroom");
  }
  if (memberId !== userId && userId !== ownerId) {
    throw new Error("Only the owner can remove other members");
  }

  const membership = await Prisma.chatroomMember.findUnique({
    where: { chatroomId_memberId: { chatroomId, memberId } },
  });

  if (!membership) {
    throw new Error("Member not found");
  }

  await Prisma.$transaction([
    Prisma.chatroomMember.delete({
      where: { chatroomId_memberId: { memberId, chatroomId } },
    }),
    // their pinned groups no longer show it
    Prisma.memberPinnedGroups.deleteMany({
      where: { chatroomId, pinGroup: { userId: memberId } },
    }),
  ]);

  // stop sending them the chatroom's messages live
  if (userActiveChatroomMap.getByKey(memberId) === chatroomId) {
    userActiveChatroomMap.deleteByKey(memberId);
  }
  const watched = userWatchedChatroomsMap.getWatched(memberId);
  if (watched.has(chatroomId)) {
    userWatchedChatroomsMap.set(
      memberId,
      [...watched].filter((id) => id !== chatroomId),
    );
  }

  sendUpdateChatrooms(chatroomId, memberId, "LEAVE");
};

export const getMemberDetails = async (
  userId: string,
  data: z.infer<typeof chatroomMemberSchema>,
): Promise<ChatroomMemberDetailsPayload> => {
  const { chatroomId, memberId } = data;

  const verify = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        memberId: userId,
        chatroomId,
      },
    },
  });

  if (!verify) {
    throw new Error(
      "Not detected as chatroom member to retrieve member details",
    );
  }

  const user = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: { memberId, chatroomId },
    },
    select: {
      joinedAt: true,
      // what other members may see (not e.g. their email)
      member: {
        select: {
          id: true,
          username: true,
          status: true,
          isGuest: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
