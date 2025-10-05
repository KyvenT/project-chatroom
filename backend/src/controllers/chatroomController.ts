import Prisma from "../prisma/prisma.js";
import { ChatroomPayload, JoinChatroomPayload } from "../types/payloads.js";
import { $Enums, ChatroomPrivacy } from "@prisma/client";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";
import {
  chatroomIdSchema,
  chatroomModifyIndexSchema,
  chatroomModifyOptionsSchema,
  chatroomSetOptionsSchema,
} from "../validators/chatrooms/chatroomValidation.js";
import { validate } from "../validators/validate.js";
import { Request, Response } from "express";

export const getUserChatrooms = async (req: Request, res: Response) => {
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

    const chatrooms = await Promise.all(chatroomPromises);

    res.status(201).json(chatrooms);
    console.log("retrieved chatrooms");
  } catch (err) {
    console.error();
    res
      .status(500)
      .json({ error: "Server error occurred while fetching chatrooms" });
  }
};

export const getChatroomDetails = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;

  const userId = req.userId;
  const { chatroomId } = data;

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
};

export const createChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomSetOptionsSchema, req.body, res);
  if (!data) return;
  const { title, privacy } = data;
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

    if (!title) {
      res.status(500).json({ message: "title missing" });
      return;
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
        role: $Enums.ChatroomRoles.OWNER,
        chatroomIndex: (existingChatroomIndex?.chatroomIndex || 15) + 1,
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
};

export const joinChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const { chatroomId } = data;
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
        res.status(400).json({ message: "Only users can join this chatroom" });
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
        chatroomIndex: (existingChatroomIndex?.chatroomIndex || 15) + 1,
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
};

export const updateChatroom = async (req: Request, res: Response) => {
  const data = validate(
    chatroomModifyOptionsSchema,
    { ...req.params, ...req.body },
    res
  );
  if (!data) return;
  const { chatroomId, title, privacy } = data;
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

    if (!title) {
      res.status(500).json({ message: "title missing" });
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
};

export const deleteChatroom = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const { chatroomId } = data;
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
      .json({ error: "Server error occurred during chatroom delete" });
  }
};

export const getUserPinnedChatrooms = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res
      .status(500)
      .json({ message: "must be signed in to get pinned chatrooms" });
    return;
  }

  // is this really costly?
  try {
    const chatrooms = await Prisma.chatroomMember.findMany({
      where: {
        memberId: userId,
        chatroomIndex: {
          lte: 15,
        },
      },
      select: {
        chatroomId: true,
        chatroom: {
          select: {
            title: true,
            messages: {
              include: {
                senderUser: {
                  select: {
                    username: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
            },
          },
        },
      },
      orderBy: {
        chatroomIndex: "asc",
      },
    });

    res.status(200).json(chatrooms);
  } catch (err) {
    console.error("retrieving pinned chatrooms error");
    res
      .status(500)
      .json({ error: "Server error occurred retrieving pinned chatrooms" });
  }
};

export const getChatroomPrivacy = async (req: Request, res: Response) => {
  const data = validate(chatroomIdSchema, req.params, res);
  if (!data) return;
  const { chatroomId } = data;

  try {
    const privacy = await Prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
      select: {
        privacy: true,
      },
    });

    res.status(200).json(privacy);
  } catch (err) {
    console.error("couldnt fetch chatroom privacy", err);
    res.status(500).json({ message: "couldnt fetch chatroom privacy" });
  }
};
