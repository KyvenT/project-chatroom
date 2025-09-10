import { json } from "zod";
import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma/prisma.js";
import { Request, Response, Router } from "express";

export const usersRouter = Router();

usersRouter.get("/me", async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const user = await Prisma.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        passwordHash: true,
      },
    });

    res.status(201).json({ user });
    console.log("retrieved /me");
  } catch (err) {
    res.status(500).json({ error: "Server error occurred while fetching /me" });
    console.error(err);
  }
});

usersRouter.patch("/me", async (req: Request, res: Response) => {
  const userId = req.userId;
  const { status } = req.body;

  try {
    const user = await Prisma.user.update({
      select: {
        id: true,
        username: true,
        status: true,
      },
      data: {
        status,
      },
      where: {
        id: userId,
      },
    });

    const affectedChatrooms = await Prisma.chatroomMember.findMany({
      select: {
        chatroomId: true,
      },
      where: {
        memberId: userId,
      },
    });

    affectedChatrooms.forEach((chatroom) => {
      const recipients = userActiveChatroomMap.getByValue(chatroom.chatroomId);
      recipients?.forEach((recipient) => {
        const socket = socketMap.getByKey(recipient);
        socket?.send(
          JSON.stringify({
            type: "status-update",
            member: {
              memberId: userId,
              member: {
                username: user.username,
                status,
              },
            },
          })
        );
      });
    });

    res.status(200).json({ message: "Status updated" });
    console.log("updated status");
  } catch (err) {
    res.status(500).json({ error: "Server error occurred while updating /me" });
  }
});
