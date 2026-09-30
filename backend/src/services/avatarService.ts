import Prisma from "../prisma.js";
import { checkAvatar } from "../lib/avatars.js";

export class AvatarError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Sets the user's profile picture, replacing any they had; returns when it
// changed, which versions its URL
export const setAvatar = async (
  userId: string,
  isGuest: boolean,
  mimeType: string,
  data: Buffer,
) => {
  // guest accounts are free to make, so they can't store pictures
  if (isGuest) {
    throw new AvatarError(403, "Only users can add a profile picture");
  }
  const check = checkAvatar(mimeType, data);
  if (!check.ok) throw new AvatarError(check.status, check.message);

  const bytes = new Uint8Array(data);
  const avatarUpdatedAt = new Date();
  await Prisma.$transaction([
    Prisma.avatar.upsert({
      where: { userId },
      create: { userId, mimeType, data: bytes },
      update: { mimeType, data: bytes },
    }),
    Prisma.user.update({
      where: { id: userId },
      data: { avatarUpdatedAt },
    }),
  ]);
  return avatarUpdatedAt;
};

export const removeAvatar = async (userId: string) => {
  await Prisma.$transaction([
    Prisma.avatar.deleteMany({ where: { userId } }),
    Prisma.user.update({
      where: { id: userId },
      data: { avatarUpdatedAt: null },
    }),
  ]);
};

export const getAvatar = async (userId: string) => {
  const avatar = await Prisma.avatar.findUnique({ where: { userId } });
  if (!avatar) throw new AvatarError(404, "No profile picture");
  return avatar;
};
