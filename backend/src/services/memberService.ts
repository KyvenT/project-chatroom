import Prisma from "../prisma/prisma.js";
import z from "zod";
import {
  chatroomIdSchema,
  chatroomModifyIndexSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import { ChatroomPrivacy } from "@prisma/client";
import {
  ChatroomMemberDetailsPayload,
  JoinChatroomPayload,
  MembersPayload,
  UserDetailsPayload,
} from "../types/payloads.js";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import { chatroomMemberSchema } from "../validators/members/memberValidation.js";

export const joinChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>
) => {
  const { chatroomId } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  if (!chatroom) {
    throw new Error("Chatroom not found");
  }

  if (verifyUser?.isGuest === true) {
    if (chatroom.privacy !== ChatroomPrivacy.PUBLIC) {
      throw new Error("Only users can join this chatroom");
    }
  } else {
    if (
      chatroom.privacy !== (ChatroomPrivacy.JOINABLE || ChatroomPrivacy.PUBLIC)
    ) {
      throw new Error("Joining this chatroom requires an invite");
    }
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

  const join = (await Prisma.chatroomMember.create({
    data: {
      memberId: userId,
      chatroomId,
      chatroomIndex: (existingChatroomIndex?.chatroomIndex || 0) + 1,
    },
    omit: {
      lastViewedAt: true,
      role: true,
    },
  })) as JoinChatroomPayload;

  sendUpdateChatrooms(chatroom.id, userId, "JOIN");
};

export const reorderChatrooms = async (
  userId: string,
  data: z.infer<typeof chatroomModifyIndexSchema>
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
  data: z.infer<typeof chatroomIdSchema>
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
      "Attempted retrieving member list from a chatroom that user is not a member of"
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
      pinGroupId: true,
      pinnedIndex: true,
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
  data: z.infer<typeof chatroomMemberSchema>
) => {
  const { chatroomId, memberId } = data;

  const verify = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        memberId: memberId,
        chatroomId,
      },
    },
    include: {
      chatroom: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!verify) {
    throw new Error("Chatroom not found");
  }

  if (memberId !== userId && userId !== verify.chatroom.ownerId) {
    throw new Error(
      "Not detected as the user that requested to leave, or is not owner of chatroom"
    );
  }

  await Prisma.chatroomMember.delete({
    where: {
      chatroomId_memberId: {
        memberId: userId,
        chatroomId,
      },
    },
  });

  sendUpdateChatrooms(chatroomId, userId, "LEAVE");
};

export const getMemberDetails = async (
  userId: string,
  data: z.infer<typeof chatroomMemberSchema>
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
      "Not detected as chatroom member to retrieve member details"
    );
  }

  const user = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: { memberId, chatroomId },
    },
    select: {
      joinedAt: true,
      member: {
        omit: {
          passwordHash: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
