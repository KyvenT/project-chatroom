import { Request, Response } from "express";
import * as authService from "../services/authService.js";

// The refresh token cookie: not readable by scripts, not sent by other
// sites' requests, HTTPS-only in production. Max-Age is in seconds.
const refreshTokenCookie = (value: string, maxAgeMs: number) =>
  [
    `refreshToken=${value}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");

const setRefreshToken = (res: Response, refreshToken: string) =>
  res.header(
    "Set-Cookie",
    refreshTokenCookie(refreshToken, authService.REFRESH_TOKEN_EXPIRATION),
  );

export const createUser = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const { refreshToken, ...userAuthDetails } =
      await authService.createUser(data);
    setRefreshToken(res, refreshToken);
    res.status(201).json({ ...userAuthDetails });
    console.log(`User registered: ${userAuthDetails.username}`);
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
    const { refreshToken, ...userAuthDetails } =
      await authService.loginUser(data);
    setRefreshToken(res, refreshToken);
    res.status(200).json({ ...userAuthDetails });
    console.log(`User logged in: ${userAuthDetails.username}`);
  } catch (error: any) {
    if (error.message === authService.INVALID_LOGIN) {
      return res.status(401).json({ message: error.message });
    }
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createGuest = async (req: Request, res: Response) => {
  const { data } = req;

  try {
    const { refreshToken, ...guestAuthDetails } =
      await authService.createGuest(data);
    setRefreshToken(res, refreshToken);
    res.status(201).json({ ...guestAuthDetails });
    console.log(`Guest created: ${guestAuthDetails.username}`);
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
    const { refreshToken: newRefreshToken, ...authDetails } =
      await authService.useRefreshToken(refreshToken);
    setRefreshToken(res, newRefreshToken);
    res.status(200).json({ ...authDetails });
  } catch (error: any) {
    console.error("Failed to refresh access token:", error);
    // the same answer whatever went wrong
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    await authService.logoutUser(refreshToken);
    res.header("Set-Cookie", refreshTokenCookie("", 0));
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: error.message });
  }
};
