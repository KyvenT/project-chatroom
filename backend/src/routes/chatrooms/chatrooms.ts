import { Router } from "express";
import Prisma from "../../prisma/prisma.js";

export const chatroomRouter = Router();

chatroomRouter.post("/create", async (req, res) => {
    const { title, userId } = req.body;

    try {
        const chatroom = await Prisma.chatroom.create({
            data: {
                title,
                ownerId: userId,
            }
        });

        res.status(201).json({ chatroom });
        console.log(`Chatroom created: ${title}`);
        return;
    } catch (error: any) {
        console.error("Chatroom creation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

