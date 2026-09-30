import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/accessToken.js";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  const result = verifyAccessToken(token);
  if (!result.ok) {
    res.status(401).json({ error: result.error });
    return;
  }

  req.userId = result.userId;
  req.isGuest = result.isGuest;
  next();
};

export default authMiddleware;
