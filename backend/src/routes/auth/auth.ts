import bcrypt from "bcryptjs";
import { Router } from "express";
import Prisma from "../../prisma/prisma.js";
import jwt from "jsonwebtoken";
import env from "../../env.js";
import type { StringValue } from "ms";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const user = await Prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
            }
        });

        const token = jwt.sign({ isUser: true, userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION as StringValue });
        res.status(201).json({ token, userId: user.id });
        console.log(`User registered: ${username}`);
        return;
    } catch (error: any) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

authRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Prisma.user.findUnique({
            where: {
                username: username,
            }
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid password" });
            return;
        }

        const token = jwt.sign({ isUser: true, userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION as StringValue });
        res.status(200).json({ token, userId: user.id });
        console.log(`User logged in: ${username}`);
        return;
    } catch (error: any) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

});

authRouter.post("/create-guest", async (req, res) => {
    const { chatroomId, username } = req.body;

    try {
        const guest = await Prisma.guest.create({
            data: {
                username,
                chatroomId,
            }
        });

        const token = jwt.sign({ isUser: false, userId: guest.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION as StringValue });
        res.status(201).json({ token, userId: guest.id });
        console.log(`Guest created: ${username}`);
        return;
    } catch (error: any) {
        console.error("Guest creation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

