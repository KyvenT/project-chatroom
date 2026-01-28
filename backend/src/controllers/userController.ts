import { Request, Response } from "express";
import * as userService from "../services/userService.js";

export const getUserDetails = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ message: "Must be signed in to get user details" });
    return;
  }

  try {
    const user = await userService.getUserDetails(userId);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error occurred while fetching /me" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res
      .status(400)
      .json({ message: "Must be signed in to update user status" });
    return;
  }

  try {
    await userService.updateUserStatus(userId, data);
    res.status(200).json({ message: "Status updated" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
