import Prisma from "../../prisma/prisma.js";
import { Request, Response, Router } from "express";

export const invitesRouter = Router();

invitesRouter.post("/send", async (req: Request, res: Response) => {
    const { receiverId, chatroomId } = req.body;
    const senderId = req.userId;

    if (!senderId) {
        res.status(400).json({error: "Must be signed in to send invite"});
        return;
    }

    try {
        const invite = await Prisma.invite.create({
            data: {
                senderId,
                receiverId,
                chatroomId
            }
        })

        res.status(201).json(invite);
        return;
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Server error occurred during invite creation" });
    }
})

invitesRouter.post("/accept", async (req: Request, res: Response) => {
    const { inviteId } = req.body;
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to accept invite"});
        return;
    }

    try {
        const invite = await Prisma.invite.update({
            where: {
                id: inviteId,
                receiverId: userId
            },
            data: {
                status: "ACCEPTED"
            }
        })

        const join = await Prisma.chatroomMember.create({
            data: {
                memberId: userId,
                chatroomId: invite.chatroomId
            }
        });

        res.status(200).json({message: "Invite accepted", join});
        console.log("invite accepted");
        return;
    } catch (err: any) {
        console.error("invite accept error", err);
        res.status(500).json({ error: "Server error occurred during invite accept"});
    }
})

invitesRouter.delete("/delete", async (req: Request, res: Response) => {
    const { inviteId } = req.body;
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({error: "Must be signed in to delete invite"});
        return;
    }

    try {
        const invite = await Prisma.invite.findUnique({
            where: {
                id: inviteId
            }
        })

        if (!invite) {
            console.error("Invite not found");
            res.status(404).json({error: "Invite not found"});
            return;
        }

        if (invite.receiverId !== userId && invite.senderId !== userId) {
            console.error("Tried to delete invite but user is not receiver nor sender of invite");
            res.status(400).json({error: "Identified user is not associated with invite id"});
            return;
        }

        const inviteDelete = await Prisma.invite.delete({
            where: {
                id: inviteId,
            }
        })

        res.status(200).json({message: "Invite deleted"});
        console.log("Invite deleted");
        return;
    } catch (err: any) {
        console.error("Invite delete error");
        res.status(500).json({error: "Server error occurred during invite deletion"});
    }
})