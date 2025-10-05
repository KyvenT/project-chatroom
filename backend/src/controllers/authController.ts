import { Request, Response } from "express";
import { guestSchema, userSchema } from "../validators/auth/authValidation.js";
import { validate } from "../validators/validate.js";
import * as authService from "../services/authService.js";

export const createUser = async (req: Request, res: Response) => {
  const data = validate(userSchema, req.body, res);
  if (!data) return;

  try {
    const userData = await authService.createUser(data);
    res.status(201).json({ ...userData });
    console.log(`User registered: ${userData.username}`);
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const authenticateUser = async (req: Request, res: Response) => {
  const data = validate(userSchema, req.body, res);
  if (!data) return;

  try {
    const userData = await authService.loginUser(data);
    res.status(200).json({ ...userData });
    console.log(`User logged in: ${userData.username}`);
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createGuest = async (req: Request, res: Response) => {
  const data = validate(guestSchema, req.body, res);
  if (!data) return;

  try {
    const guestData = await authService.createGuest(data);
    res.status(201).json({ ...guestData });
    console.log(`Guest created: ${guestData.username}`);
  } catch (error: any) {
    console.error("Guest creation error:", error);
    res.status(500).json({ message: error.message });
  }
};
