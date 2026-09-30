import { AttachmentCheck, matchesSignature } from "./attachments.js";

// the largest profile picture that can be uploaded (bytes); the app shrinks
// pictures before sending them, so real ones are far smaller
export const MAX_AVATAR_SIZE = 512 * 1024;

// still images only
const AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const checkAvatar = (
  mimeType: string,
  data: Buffer,
): AttachmentCheck => {
  if (!AVATAR_TYPES.has(mimeType)) {
    return {
      ok: false,
      status: 415,
      message: "Profile pictures must be PNG, JPEG or WebP images",
    };
  }
  if (data.length === 0) {
    return { ok: false, status: 400, message: "The picture is empty" };
  }
  if (data.length > MAX_AVATAR_SIZE) {
    return { ok: false, status: 413, message: "The picture is too large" };
  }
  if (!matchesSignature(mimeType, data)) {
    return {
      ok: false,
      status: 415,
      message: "The picture's contents don't match its type",
    };
  }
  return { ok: true };
};
