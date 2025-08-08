import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";

const messagesRouter = Router();

messagesRouter.get("/:chatroomId", async (req: Request, res: Response) => {
    const {chatroomId} = req.params;
    const {getBefore} = req.body;
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to get messages"});
        return;
    }

    try {
        const verify = await Prisma.chatroomMember.findUnique({
            where: {
                chatroomId_memberId: {
                    memberId: userId,
                    chatroomId
                }
            }
        })

        if (!verify) {
            res.status(400).json({error: "Not detected as a member of that chatroom"});
            return;
        }

        const chatroomMessages = await Prisma.message.findMany({
            where: {
                chatroomId,
                createdAt: {
                    lte: getBefore
                }
            },
            orderBy: {
                createdAt: 'asc'
            }, 
            take: 25,
        })

        res.status(201).json({chatroomMessages});
        console.log("messages retrieved");
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Server error occurred while retrieving messages"});
    }
})