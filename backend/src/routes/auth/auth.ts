import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import Prisma from "../../prisma/prisma.js";
import jwt from "jsonwebtoken";
import env from "../../env.js";
import type { StringValue } from "ms";
import crypto from "crypto";
import { validate } from "../../validators/validate.js";
import {
  guestSchema,
  userSchema,
} from "../../validators/auth/authValidators.js";

export const authRouter = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  validate(userSchema, req.body);
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await Prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRATION as StringValue,
    });
    res.status(201).json({ token, userId: user.id, username, isGuest: false });
    console.log(`User registered: ${username}`);
    return;
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error occurred during signup" });
  }
});

authRouter.post("/login", async (req, res) => {
  validate(userSchema, req.body);
  const { username, password } = req.body;

  try {
    const user = await Prisma.user.findUnique({
      where: {
        username: username,
      },
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

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRATION as StringValue,
    });
    res
      .status(200)
      .json({ token, userId: user.id, username, isGuest: user.isGuest });
    console.log(`User logged in: ${username}`);
    return;
  } catch (error: any) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ error: "Server error occurred during login" });
  }
});

authRouter.post("/create-guest", async (req, res) => {
  validate(guestSchema, req.body);
  const { chatroomId, username } = req.body;
  const randomlyGeneratedPassword = crypto.randomBytes(16).toString("hex");

  try {
    const verifyPrivacy = await Prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (verifyPrivacy?.privacy !== "PUBLIC") {
      res
        .status(500)
        .json({ message: "Guests are not allowed to join this chatroom" });
      return;
    }

    const guest = await Prisma.user.create({
      data: {
        username,
        passwordHash: randomlyGeneratedPassword,
        isGuest: true,
      },
    });

    const guestMember = await Prisma.chatroomMember.create({
      data: {
        memberId: guest.id,
        chatroomId,
        chatroomIndex: 1,
      },
    });

    const token = jwt.sign({ userId: guest.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRATION as StringValue,
    });
    res.status(201).json({ token, userId: guest.id, username, isGuest: true });
    console.log(`Guest created: ${username}`);
    return;
  } catch (error: any) {
    console.error("Guest creation error:", error);
    res
      .status(500)
      .json({ error: "Server error occurred during guest creation" });
  }
});
