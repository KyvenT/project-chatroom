import Prisma from "../../prisma.js";
import { MembersPayload } from "../../types/payloads.js";
import { socketMap } from "../../lib/socketMaps.js";

export type UpdateMembersActions = "JOIN" | "LEAVE";

export const sendUpdateMembers = async (
  chatroomId: string,
  memberId: string,
  actionType: UpdateMembersActions,
) => {
  const messageOptions: any = {};
  switch (actionType) {
    case "JOIN":
      const member = (await Prisma.chatroomMember.findUnique({
        where: {
          chatroomId_memberId: {
            chatroomId,
            memberId,
          },
        },
        select: {
          memberId: true,
          member: {
            select: {
              username: true,
              status: true,
            },
          },
          role: true,
        },
      })) as MembersPayload;

      messageOptions.member = member;

      break;
    case "LEAVE":
      messageOptions.memberId = memberId;
      break;
    default:
      console.log("unknown action type on updating members");
      return;
  }
  messageOptions.action = actionType;

  const recipients = await Prisma.chatroomMember.findMany({
    where: {
      chatroomId,
    },
  });

  recipients.forEach((recipient) => {
    if (recipient.memberId === memberId) return;
    const socket = socketMap.getByKey(recipient.memberId);
    socket?.send(
      JSON.stringify({
        type: "update-members",
        chatroomId,
        ...messageOptions,
      }),
    );
  });
};
