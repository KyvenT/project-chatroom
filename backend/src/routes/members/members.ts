import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";
import { MembersPayload } from "../../types/payloads.js";
import { sendUpdateChatrooms } from "../../wss/outgoing-messages/update-chatrooms.js";

export const membersRouter = Router();

membersRouter.get("/:chatroomId", async (req: Request, res: Response) => {
  const userId = req.userId;
  const { chatroomId } = req.params;

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
});

membersRouter.delete("/:chatroomId", async (req: Request, res: Response) => {
  const userId = req.userId;
  const { chatroomId } = req.params;
  const { memberId } = req.body;

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
});
