import jwt from "jsonwebtoken";
import env from "../env.js";

export type AccessTokenResult =
  | { ok: true; userId: string; isGuest: boolean; sessionId?: string }
  | { ok: false; error: "Expired token" | "Invalid token" };

// Checks an access token, accepting only the algorithm we sign with and
// tokens that name a user
export const verifyAccessToken = (token: string): AccessTokenResult => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" || typeof decoded.userId !== "string") {
      return { ok: false, error: "Invalid token" };
    }
    return {
      ok: true,
      userId: decoded.userId,
      isGuest: decoded.isGuest === true,
      // the login session the token was issued for
      sessionId: typeof decoded.sid === "string" ? decoded.sid : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      error:
        err?.name === "TokenExpiredError" ? "Expired token" : "Invalid token",
    };
  }
};
