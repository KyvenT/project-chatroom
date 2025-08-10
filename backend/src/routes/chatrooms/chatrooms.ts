import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";

export const chatroomRouter = Router();

chatroomRouter.get("/me", async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to get chatrooms"});
        return;
    }

    try {
        const chatrooms = await Prisma.chatroomMember.findMany({
            where: {
                memberId: userId,
            },
            select: {
                chatroomId: true,
                chatroom: {
                    select: {
                        title: true
                    }
                }
            }
        })

        res.status(201).json(chatrooms);
        console.log("retrieved chatrooms");

    } catch (err) {
        console.error();
        res.status(500).json({error: "Server error occurred while fetching chatrooms"});
    }
})

chatroomRouter.post("/create", async (req: Request, res: Response) => {
    const { title } = req.body;
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to create a chatroom"});
        return;
    }

    try {
        const chatroom = await Prisma.chatroom.create({
            data: {
                title,
                ownerId: userId,
            }
        });

        const ownerJoin = await Prisma.chatroomMember.create({
            data: {
                memberId: userId,
                chatroomId: chatroom.id
            }
        });

        res.status(201).json(chatroom);
        console.log(`Chatroom created: ${title}`);
        return;
    } catch (error: any) {
        console.error("Chatroom creation error:", error);
        res.status(500).json({ error: "Server error occurred during chatroom creation" });
    }
});

// chatroom join by link
chatroomRouter.post("/join", async (req: Request, res: Response) => {
    const { chatroomId } = req.body;
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to join"});
        return;
    }

    try {
        const chatroom = await Prisma.chatroom.findUnique({
            where: {
                id: chatroomId
            }
        })

        if (!chatroom) {
            res.status(404).json({error: "Chatroom not found"});
            return;
        }

        if (!chatroom.allowJoinByLink) {
            res.status(400).json({error: "Joining this chatroom requires an invite"});
            return;
        }

        const join = await Prisma.chatroomMember.create({
            data: {
                memberId: userId,
                chatroomId
            }
        });

        res.status(201).json({ join });
        console.log(`Chatroom joined: ${join}`);
        return;
    } catch (error: any) {
        console.error("Chatroom join error:", error);
        res.status(500).json({ error: "Server error occurred during chatroom join" });
    }
});

chatroomRouter.patch("/rename", async (req: Request, res: Response) => {
    const { chatroomId, newTitle } = req.body;
    const userId = req.userId;

    try {
        const chatroom = await Prisma.chatroom.update({
            where: {
                id: chatroomId,
                ownerId: userId
            },
            data: {
                title: newTitle
            }
        })

        res.status(200).json({message: "Chatroom renamed"});
        console.log("Chatroom renamed");
        return;
    } catch (err: any) {
        console.error("Chatroom rename error");
        res.status(500).json({error: "Server error occurred during chatroom rename"})
    }
})

chatroomRouter.delete("/delete", async (req: Request, res: Response) => {
    const { chatroomId } = req.body;
    const userId = req.userId;

    try {
        const chatroom = await Prisma.chatroom.delete({
            where: {
                id: chatroomId,
                ownerId: userId
            }
        })

        res.status(200).json({message: "Chatroom deleted"});
        console.error("Chatroom deleted");
        return;
    } catch (err: any) {
        console.error("Chatroom delete error");
        res.status(500).json({error: "Server error occurrred during chatroom delete"});
    }
})