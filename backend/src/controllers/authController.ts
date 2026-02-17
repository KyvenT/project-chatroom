import { Request, Response } from "express";
import * as authService from "../services/authService.js";

export const createUser = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const { refreshToken, ...userData } = await authService.createUser(data);
    res.header(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${authService.REFRESH_TOKEN_EXPIRATION}`,
    );
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
    const { refreshToken, ...userData } = await authService.loginUser(data);
    res.header(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${authService.REFRESH_TOKEN_EXPIRATION}`,
    );
    res.status(200).json({ ...userData });
    console.log(`User logged in: ${userData.username}`);
  } catch (error: any) {
    console.error("Login error:", error);
    if (
      error.message === "User not found" ||
      error.message === "Invalid password"
    ) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const createGuest = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const { refreshToken, ...guestData } = await authService.createGuest(data);
    res.header(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${authService.REFRESH_TOKEN_EXPIRATION}`,
    );
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

export const useRefreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const { refreshToken: newRefreshToken, accessToken } =
      await authService.useRefreshToken(refreshToken);
    res.header(
      "Set-Cookie",
      `refreshToken=${newRefreshToken}; HttpOnly; Path=/; Max-Age=${authService.REFRESH_TOKEN_EXPIRATION}`,
    );
    res.status(200).json({ accessToken });
  } catch (error: any) {
    console.error("Failed to refresh access token:", error);
    return res.status(401).json({ message: error.message });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    await authService.logoutUser(refreshToken);
    res.header("Set-Cookie", `refreshToken=; HttpOnly; Path=/; Max-Age=0`);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: error.message });
  }
};
