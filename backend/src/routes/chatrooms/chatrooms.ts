import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";
import { ChatroomPayload, JoinChatroomPayload } from "../../types/payloads.js";
import { $Enums, ChatroomPrivacy } from "@prisma/client";
import { sendUpdateChatrooms } from "../../wss/outgoing-messages/update-chatrooms.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to get chatrooms" });
    return;
  }

  try {
    const chatroomsData = await Prisma.chatroomMember.findMany({
      where: {
        memberId: userId,
      },
      select: {
        chatroomId: true,
        lastViewedAt: true,
        chatroom: {
          select: {
            title: true,
            privacy: true,
            ownerId: true,
          },
        },
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

    const chatrooms = await Promise.all(chatroomPromises);

    res.status(201).json(chatrooms);
    console.log("retrieved chatrooms");
  } catch (err) {
    console.error();
    res
      .status(500)
      .json({ error: "Server error occurred while fetching chatrooms" });
  }
});

chatroomRouter.get("/:chatroomId", async (req: Request, res: Response) => {
  const { chatroomId } = req.params;
  const userId = req.userId;

  if (!userId) {
    res
      .status(400)
      .json({ error: "Must be signed in to get chatroom details" });
    return;
  }

  try {
    const verifyMembership = await Prisma.chatroomMember.findUnique({
      where: {
        chatroomId_memberId: {
          chatroomId,
          memberId: userId,
        },
      },
    });

    if (!verifyMembership) {
      res.status(400).json({ error: "Not detected as a member of chatroom" });
      return;
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

    res.status(200).json(chatroomDetails);
    console.log("fetched chatroom details");
  } catch (err) {
    console.error("could not fetch chatroom details", err);
    res
      .status(400)
      .json({ error: "Server error occurred while fetching chatroom details" });
  }
});

chatroomRouter.post("/create", async (req: Request, res: Response) => {
  const { title, privacy } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Must be signed in to create a chatroom" });
    return;
  }

  try {
    const verifyUser = await Prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (verifyUser?.isGuest === true) {
      res.status(400).json({ message: "Only users can create chatrooms" });
      return;
    }

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
        role: $Enums.ChatroomRoles.OWNER,
      },
      omit: {
        lastViewedAt: true,
      },
    })) as JoinChatroomPayload;

    sendUpdateChatrooms(chatroom.id, userId, "JOIN");

    res.status(201).json(ownerJoin);
    console.log(`Chatroom created: ${title}`);
  } catch (error: any) {
    console.error("Chatroom creation error:", error);
    res
      .status(500)
      .json({ error: "Server error occurred during chatroom creation" });
  }
});

// chatroom join by link
chatroomRouter.post(
  "/join/:chatroomId",
  async (req: Request, res: Response) => {
    const { chatroomId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(400).json({ error: "Must be signed in to join" });
      return;
    }

    try {
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
        res.status(404).json({ error: "Chatroom not found" });
        return;
      }

      if (verifyUser?.isGuest === true) {
        if (chatroom.privacy !== ChatroomPrivacy.PUBLIC) {
          res
            .status(400)
            .json({ message: "Only users can join this chatroom" });
          return;
        }
      } else {
        if (
          chatroom.privacy !==
          (ChatroomPrivacy.JOINABLE || ChatroomPrivacy.PUBLIC)
        ) {
          res
            .status(400)
            .json({ error: "Joining this chatroom requires an invite" });
          return;
        }
      }

      const join = (await Prisma.chatroomMember.create({
        data: {
          memberId: userId,
          chatroomId,
        },
        omit: {
          lastViewedAt: true,
          role: true,
        },
      })) as JoinChatroomPayload;

      sendUpdateChatrooms(chatroom.id, userId, "JOIN");

      res.status(200).json(join);
      console.log(`Chatroom joined: ${join}`);
      return;
    } catch (error: any) {
      console.error("Chatroom join error:", error);
      res
        .status(500)
        .json({ error: "Server error occurred during chatroom join" });
    }
  }
);

chatroomRouter.patch("/:chatroomId", async (req: Request, res: Response) => {
  const { chatroomId } = req.params;
  const { title, privacy } = req.body;
  const userId = req.userId;

  try {
    const verify = await Prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (verify?.ownerId !== userId) {
      res.status(500).json({ message: "not owner of chatroom" });
      return;
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

    res.status(200).json({ message: "Chatroom updated" });
    console.log("Chatroom renamed", title, privacy, chatroomId);
    return;
  } catch (err: any) {
    console.error("Chatroom rename error");
    res
      .status(500)
      .json({ error: "Server error occurred during chatroom rename" });
  }
});

chatroomRouter.delete("/:chatroomId", async (req: Request, res: Response) => {
  const { chatroomId } = req.params;
  const userId = req.userId;

  try {
    const verify = await Prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (verify?.ownerId !== userId) {
      res.status(400).json({ error: "not owner of chatroom" });
      return;
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

    res.status(200).json({ message: "Chatroom deleted" });
    console.error("Chatroom deleted");
    return;
  } catch (err: any) {
    console.error("Chatroom delete error");
    res
      .status(500)
      .json({ error: "Server error occurrred during chatroom delete" });
  }
});
