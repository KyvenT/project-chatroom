import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";

export const messagesRouter = Router();

messagesRouter.get("/:chatroomId/:getBefore", async (req: Request, res: Response) => {
    const {chatroomId, getBefore} = req.params;
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to get messages"});
        return;
    }
    console.log("get messages before " + getBefore + " for " + userId);

    try {
        const verifyPromise = Prisma.chatroomMember.findUnique({
            where: {
                chatroomId_memberId: {
                    memberId: userId,
                    chatroomId
                }
            }
        })

        const messagesPromise = Prisma.message.findMany({
            where: {
                chatroomId,
                createdAt: {
                    lte: getBefore
                }
            },
            include: {
                senderUser: {
                    select: {
                        username: true
                    }
                },
                senderGuest: {
                    select: {
                        username: true
                    }
                },
            },
            orderBy: {
                createdAt: 'asc'
            }, 
            take: 25,
        })

        const [verify, messages] = await Promise.all([verifyPromise, messagesPromise]);

        if (!verify) {
            res.status(400).json({error: "Not detected as a member of that chatroom"});
            return;
        }

        res.status(201).json(messages);
        console.log("messages retrieved");
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error occurred while retrieving messages"});
    }
})