import Prisma from "../../prisma/prisma.js";
import { Request, Response, Router } from "express";

export const usersRouter = Router();

usersRouter.get("/me", async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const user = await Prisma.user.findUnique({
            where: {
                id: userId
            },
            omit: {
                passwordHash: true,
            }
        })

        res.status(201).json({user});
        console.log("retrieved /me");
    } catch (err) {
        res.status(500).json({error: "Server error occurred while fetching /me"});
        console.error(err);
    }
});