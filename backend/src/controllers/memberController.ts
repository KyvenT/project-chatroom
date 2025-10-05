import Prisma from "../prisma/prisma.js";
import {
  chatroomModifyIndexSchema,
  chatroomIdSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import { validate } from "../validators/validate.js";
import { Request, Response } from "express";
import { MembersPayload } from "../types/payloads.js";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import { memberLeaveSchema } from "../validators/members/memberValidation.js";

export const reorderMemberChatroom = async (req: Request, res: Response) => {
  const data = validate(
    chatroomModifyIndexSchema,
    { ...req.params, ...req.body },
    res
  );
  if (!data) return;
  const { chatroomId, newIndex } = data;
  const userId = req.userId;

  if (!userId) {
    res.status(500).json({ message: "must be signed in to pin a chatroom" });
    return;
  }

  try {
    const verifyUser = await Prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (verifyUser?.isGuest === true) {
      res.status(500).json({ message: "must be a user to pin chatrooms" });
      return;
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

    res.status(200).json({ message: "chatrooms reordered" });
  } catch (err) {
    console.error("Chatroom pin error");
    res
      .status(500)
      .json({ error: "Server error occurred during chatroom pin" });
  }
};

export const getChatroomMembers = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const { chatroomId } = data;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to get members list" });
    return;
  }
  console.log("get members list for " + userId);

  try {
    const verify = await Prisma.chatroomMember.findUnique({
      where: {
        chatroomId_memberId: {
          memberId: userId,
          chatroomId,
        },
      },
    });

    if (!verify) {
      console.error(
        "attempted retrieving member list from a chatroom that user is not a member of"
      );
      res
        .status(400)
        .json({ error: "Not detected as a member of that chatroom" });
      return;
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
      },
    }) as Promise<MembersPayload[]>;

    const [members] = await Promise.all([membersPromise]);

    res.status(201).json(members);
    console.log("member list retrieved");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error occurred while retrieving member list" });
  }
};

export const removeMemberFromChatroom = async (req: Request, res: Response) => {
  const data = validate(memberLeaveSchema, { ...req.params, ...req.body }, res);
  if (!data) return;
  const { chatroomId, memberId } = data;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to leave chatroom" });
    return;
  }

  try {
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
      res.status(404).json({ message: "Chatroom not found" });
      return;
    }

    if (memberId !== userId && userId !== verify.chatroom.ownerId) {
      res.status(500).json({
        message: `Not detected as the user that requested to leave, 
            or is not owner of chatroom`,
      });
      return;
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

    res.status(201).json({ message: "Member left successfully" });
    console.log("chatroom left");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error occurred while leaving chatroom" });
  }
};
