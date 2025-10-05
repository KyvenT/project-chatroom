import { Request, Response } from "express";
import { guestSchema, userSchema } from "../validators/auth/authValidation.js";
import { validate } from "../validators/validate.js";
import bcrypt from "bcryptjs";
import Prisma from "../prisma/prisma.js";
import jwt from "jsonwebtoken";
import env from "../env.js";
import type { StringValue } from "ms";
import crypto from "crypto";

export const createUser = async (req: Request, res: Response) => {
  const data = validate(userSchema, req.body, res);
  if (!data) return;

  const { username, password } = data;
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
};

export const authenticateUser = async (req: Request, res: Response) => {
  const data = validate(userSchema, req.body, res);
  if (!data) return;

  const { username, password } = data;

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
};

export const createGuest = async (req: Request, res: Response) => {
  const data = validate(guestSchema, req.body, res);
  if (!data) return;

  const { chatroomId, username } = data;
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
};
