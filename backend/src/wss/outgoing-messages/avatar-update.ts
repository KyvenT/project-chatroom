import { socketMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma.js";

// Tells the user and everyone who shares a chatroom with them that their
// profile picture changed, so it's shown everywhere without reloading
export const sendAvatarUpdate = async (
  userId: string,
  avatarUpdatedAt: Date | null,
) => {
  try {
    const members = await Prisma.chatroomMember.findMany({
      where: { chatroom: { members: { some: { memberId: userId } } } },
      select: { memberId: true },
      distinct: ["memberId"],
    });
    const recipients = new Set([userId, ...members.map((m) => m.memberId)]);

    const data = JSON.stringify({
      type: "avatar-updated",
      userId,
      avatarUpdatedAt,
    });
    recipients.forEach((recipient) =>
      socketMap.getByKey(recipient)?.send(data),
    );
  } catch (err) {
    console.error(err);
  }
};
