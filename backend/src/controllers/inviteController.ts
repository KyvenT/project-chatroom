import { handleNewNotification } from "../wss/outgoing-messages/notification.js";
import { InvitePayload, JoinChatroomPayload } from "../types/payloads.js";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import { $Enums } from "@prisma/client";
import { validate } from "../validators/validate.js";
import {
  inviteIdSchema,
  sendInviteSchema,
  updateInviteStatusSchema,
} from "../validators/invites/inviteValidation.js";
import { chatroomIdSchema } from "../validators/chatrooms/chatroomValidation.js";
import Prisma from "../prisma/prisma.js";
import { Request, Response } from "express";

export const getUserInvites = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to get invites" });
    return;
  }
  console.log("get invites for " + userId);

  try {
    const invites = (await Prisma.invite.findMany({
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
    })) as InvitePayload[];

    res.status(201).json(invites);
    return;
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error occurred during invites retrieval" });
  }
};

export const createInvite = async (req: Request, res: Response) => {
  const data = validate(sendInviteSchema, req.body, res);
  if (!data) return;
  const { receiverUsername, chatroomId } = data;
  const senderId = req.userId;

  if (!senderId) {
    res.status(400).json({ message: "Must be signed in to send invite" });
    return;
  }

  try {
    const verifyUser = await Prisma.user.findUnique({
      where: {
        id: senderId,
      },
    });

    if (verifyUser?.isGuest === true) {
      res.status(400).json({ message: "Only users can send invites" });
      return;
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
      res.status(404).json({ message: "User not found" });
      return;
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

    const invite = (await Prisma.invite.create({
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
    })) as InvitePayload;

    handleNewNotification("INVITE", receiver.id, {
      invite,
    });

    res.status(201).json({ message: "Invite sent successfully" });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error occurred during invite creation" });
  }
};

export const respondToInvite = async (req: Request, res: Response) => {
  const data = validate(updateInviteStatusSchema, req.body, res);
  if (!data) return;
  const { inviteId, status } = data;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to accept invite" });
    return;
  }

  try {
    const verify = await Prisma.invite.findUnique({
      where: {
        id: inviteId,
      },
    });

    if (!verify) {
      res.status(400).json({ message: "invite not found" });
      return;
    }

    if (verify.receiverId !== userId) {
      res
        .status(400)
        .json({ message: "not detected as receiver of this invite" });
      return;
    }

    const invite = await Prisma.invite.update({
      where: {
        id: inviteId,
      },
      data: {
        status,
      },
    });

    if (status === $Enums.InviteStatus.REJECTED) return;

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
        chatroomId: invite.chatroomId,
        chatroomIndex: (existingChatroomIndex?.chatroomIndex || 15) + 1,
      },
      omit: {
        lastViewedAt: true,
        role: true,
      },
    })) as JoinChatroomPayload;

    sendUpdateChatrooms(invite.chatroomId, userId, "JOIN");

    res.status(200).json(join);
    console.log("invite accepted");
    return;
  } catch (err: any) {
    console.error("invite accept error", err);
    res
      .status(500)
      .json({ message: "Server error occurred during invite accept" });
  }
};

export const deleteInvite = async (req: Request, res: Response) => {
  const data = validate(inviteIdSchema, req.body, res);
  if (!data) return;
  const { inviteId } = data;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to delete invite" });
    return;
  }

  try {
    const invite = await Prisma.invite.findUnique({
      where: {
        id: inviteId,
      },
    });

    if (!invite) {
      console.error("Invite not found");
      res.status(404).json({ error: "Invite not found" });
      return;
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
      console.error(
        "Tried to delete invite but user is not receiver, sender, or owner of chatroom"
      );
      res
        .status(400)
        .json({ message: "Identified user is not associated with invite id" });
      return;
    }

    await Prisma.invite.delete({
      where: {
        id: inviteId,
      },
    });

    res.status(200).json({ message: "Invite deleted", inviteId });
    console.log("Invite deleted");
  } catch (err: any) {
    console.error("Invite delete error");
    res
      .status(500)
      .json({ message: "Server error occurred during invite deletion" });
  }
};

export const getChatroomInvites = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const { chatroomId } = data;

  try {
    const invites = (await Prisma.invite.findMany({
      where: {
        chatroomId,
        status: {
          not: $Enums.InviteStatus.ACCEPTED,
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
    })) as InvitePayload[];

    res.status(200).json(invites);
    console.log("Invites retrieved for " + chatroomId);
  } catch (err) {
    console.error("invites fetch error for " + chatroomId);
    res.status(500).json({
      message: "Server error occurred during invites fetch of chatroom",
    });
  }
};
