import { Request, Response } from "express";
import * as authService from "../services/authService.js";

export const createUser = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const userData = await authService.createUser(data);
    res.status(201).json({ ...userData });
    console.log(`User registered: ${userData.username}`);
  } catch (error: any) {
    if (error.message === "Username already exists") {
      return res.status(409).json({ message: error.message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const authenticateUser = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const userData = await authService.loginUser(data);
    res.status(200).json({ ...userData });
    console.log(`User logged in: ${userData.username}`);
  } catch (error: any) {
    console.error("Login error:", error);
    if (
      error.message === "User not found" ||
      error.message === "Invalid password"
    ) {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const createGuest = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const guestData = await authService.createGuest(data);
    res.status(201).json({ ...guestData });
    console.log(`Guest created: ${guestData.username}`);
  } catch (error: any) {
    switch (error.message) {
      case "Username already exists":
        return res.status(409).json({ message: error.message });
      case "Guests are not allowed to join this chatroom":
        return res.status(403).json({ message: error.message });
      default:
        return res.status(500).json({ message: error.message });
    }
  }
};
