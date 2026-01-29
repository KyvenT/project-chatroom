import z from "zod";
import Prisma from "../prisma.js";
import { InvitePayload } from "../types/payloads.js";
import {
  inviteIdSchema,
  sendInviteSchema,
  updateInviteStatusSchema,
} from "../validators/invites/inviteValidation.js";
import { handleNewNotification } from "../wss/outgoing-messages/notification.js";
import { InviteStatus } from "@prisma/client";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import { chatroomIdSchema } from "../validators/chatrooms/chatroomValidation.js";
import { sendUpdateInvites } from "../wss/outgoing-messages/update-invites.js";

export const getUserInvites = async (
  userId: string,
): Promise<InvitePayload[]> => {
  const invites = await Prisma.invite.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      chatroom: {
        select: {
          title: true,
        },
      },
      sender: {
        select: {
          username: true,
        },
      },
      receiver: {
        select: {
          username: true,
        },
      },
    },
  });
  return invites;
};

export const createInvite = async (
  senderId: string,
  data: z.infer<typeof sendInviteSchema>,
) => {
  const { receiverUsername, chatroomId } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: senderId,
    },
  });

  if (verifyUser?.isGuest === true) {
    throw new Error("Only users can send invites");
  }

  const receiverPromise = Prisma.user.findUnique({
    where: {
      username: receiverUsername,
    },
    select: {
      id: true,
    },
  });

  const checkExistingPromise = Prisma.invite.findMany({
    where: {
      receiver: {
        username: receiverUsername,
      },
      chatroomId,
    },
  });

  const [receiver, checkExisting] = await Promise.all([
    receiverPromise,
    checkExistingPromise,
  ]);

  if (!receiver) {
    throw new Error("User not found");
  }

  if (checkExisting) {
    const deletePrevious = await Prisma.invite.deleteMany({
      where: {
        receiver: {
          username: receiverUsername,
        },
        chatroomId,
      },
    });
  }

  const invite = await Prisma.invite.create({
    data: {
      senderId,
      receiverId: receiver.id,
      chatroomId,
    },
    include: {
      chatroom: {
        select: {
          title: true,
        },
      },
      sender: {
        select: {
          username: true,
        },
      },
      receiver: {
        select: {
          username: true,
        },
      },
    },
  });

  handleNewNotification("INVITE", receiver.id, {
    inviteId: invite.id,
  });
  sendUpdateInvites({
    memberId: receiver.id,
    actionType: "ADD",
    invite: invite,
  });
};

export const respondToInvite = async (
  userId: string,
  data: z.infer<typeof updateInviteStatusSchema>,
) => {
  const { inviteId, status } = data;

  const verify = await Prisma.invite.findUnique({
    where: {
      id: inviteId,
    },
  });

  if (!verify) {
    throw new Error("Invite not found");
  }

  if (verify.receiverId !== userId) {
    throw new Error("Not detected as receiver of this invite");
  }

  const invite = await Prisma.invite.update({
    where: {
      id: inviteId,
    },
    data: {
      status,
    },
  });

  if (status === InviteStatus.REJECTED) return;

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

  const join = await Prisma.chatroomMember.create({
    data: {
      memberId: userId,
      chatroomId: invite.chatroomId,
      chatroomIndex: (existingChatroomIndex?.chatroomIndex || 0) + 1,
    },
    omit: {
      lastViewedAt: true,
      role: true,
    },
  });

  sendUpdateChatrooms(invite.chatroomId, userId, "JOIN");
  sendUpdateInvites({ memberId: userId, actionType: "DELETE", inviteId });
};

export const deleteInvite = async (
  userId: string,
  data: z.infer<typeof inviteIdSchema>,
) => {
  const { inviteId } = data;

  const invite = await Prisma.invite.findUnique({
    where: {
      id: inviteId,
    },
  });

  if (!invite) {
    throw new Error("Invite not found");
  }

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      id: invite.chatroomId,
    },
  });

  if (
    invite.receiverId !== userId &&
    invite.senderId !== userId &&
    userId !== chatroom?.ownerId
  ) {
    throw new Error(
      "Tried to delete invite but user is not receiver, sender, or owner of chatroom",
    );
  }

  await Prisma.invite.delete({
    where: {
      id: inviteId,
    },
  });

  sendUpdateInvites({ memberId: userId, actionType: "DELETE", inviteId });
};

export const getChatroomInvites = async (
  userId: string,
  data: z.infer<typeof chatroomIdSchema>,
): Promise<InvitePayload[]> => {
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
    throw new Error("Not detected as member of chatroom");
  }

  const invites = await Prisma.invite.findMany({
    where: {
      chatroomId,
      status: {
        not: InviteStatus.ACCEPTED,
      },
    },
    include: {
      chatroom: {
        select: {
          title: true,
        },
      },
      sender: {
        select: {
          username: true,
        },
      },
      receiver: {
        select: {
          username: true,
        },
      },
    },
  });

  return invites;
};
