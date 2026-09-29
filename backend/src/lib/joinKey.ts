import crypto from "crypto";

// 12 random bytes -> 16 URL-safe characters (96 bits of entropy)
export const JOIN_KEY_LENGTH = 16;

export const generateJoinKey = (): string =>
  crypto.randomBytes(12).toString("base64url");
