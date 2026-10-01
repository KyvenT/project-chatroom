import { useActiveChatroomStore, useMembersStore } from "../../hooks/useStores";
import type { UpdateMembersMessage } from "../../types/ws-messages";
import type { ChatroomMember } from "../../types/REST-types/ChatroomMember";
import { updateCachedMembers } from "../../utils/membersCache";

export const handleUpdateMembers = (message: UpdateMembersMessage) => {
  const { member, memberId } = message;
  // pop-outs show members of chatrooms other than the page's
  if (message.action === "JOIN" && member) {
    updateCachedMembers(message.chatroomId, (members) => [
      ...members.filter((m) => m.memberId !== member.memberId),
      member as ChatroomMember,
    ]);
  } else if (message.action === "LEAVE" && memberId) {
    updateCachedMembers(message.chatroomId, (members) =>
      members.filter((m) => m.memberId !== memberId),
    );
  }

  const chatroomId = useActiveChatroomStore.getState().activeChatroomId;
  if (message.chatroomId !== chatroomId) return;

  switch (message.action) {
    case "JOIN":
      if (!message.member) return;
      useMembersStore.getState().addNewMember(message.member);
      break;
    case "LEAVE":
      if (!message.memberId) return;
      useMembersStore.getState().removeMember(message.memberId);
      break;
    default:
      console.log("unknown action type for updating members");
  }
};
