import Prisma from "../prisma.js";

// whether the user is a member of the chatroom; socket messages naming a
// chatroom are only acted on for its members
export const isChatroomMember = async (userId: string, chatroomId: string) => {
  const member = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: { chatroomId, memberId: userId },
    },
    select: { memberId: true },
  });
  return !!member;
};
