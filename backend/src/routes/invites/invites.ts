import Prisma from "../../prisma/prisma.js";
import { Request, Response, Router } from "express";
import { handleNewNotification } from "../../wss/notification.js";
import { InvitePayload, JoinChatroomPayload } from "../../types/payloads.js";
import { sendUpdateChatrooms } from "../../wss/update-chatrooms.js";
import { $Enums } from "@prisma/client";

export const invitesRouter = Router();

invitesRouter.get("/me", async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to get invites" });
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
      .json({ error: "Server error occurred during invites retrieval" });
  }
});

invitesRouter.post("/send", async (req: Request, res: Response) => {
  const { receiverUsername, chatroomId } = req.body;
  const senderId = req.userId;

  if (!senderId) {
    res.status(400).json({ error: "Must be signed in to send invite" });
    return;
  }

  try {
    const receiver = await Prisma.user.findUnique({
      where: {
        username: receiverUsername,
      },
      select: {
        id: true,
      },
    });

    if (!receiver) {
      res.status(404).json({ error: "User not found" });
      return;
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
      .json({ error: "Server error occurred during invite creation" });
  }
});

invitesRouter.patch("/respond", async (req: Request, res: Response) => {
  const { inviteId, status } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to accept invite" });
    return;
  }

  try {
    const verify = await Prisma.invite.findUnique({
      where: {
        id: inviteId,
        receiverId: userId,
        status: "PENDING",
      },
    });

    if (!verify) {
      res.status(400).json({ error: "invite not found" });
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

    const join = (await Prisma.chatroomMember.create({
      data: {
        memberId: userId,
        chatroomId: invite.chatroomId,
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
      .json({ error: "Server error occurred during invite accept" });
  }
});

invitesRouter.delete("/delete", async (req: Request, res: Response) => {
  const { inviteId } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to delete invite" });
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

    if (invite.receiverId !== userId && invite.senderId !== userId) {
      console.error(
        "Tried to delete invite but user is not receiver nor sender of invite"
      );
      res
        .status(400)
        .json({ error: "Identified user is not associated with invite id" });
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
      .json({ error: "Server error occurred during invite deletion" });
  }
});

invitesRouter.get("/:chatroomId", async (req: Request, res: Response) => {
  const { chatroomId } = req.params;

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
      error: "Server error occurred during invites fetch of chatroom",
    });
  }
});
