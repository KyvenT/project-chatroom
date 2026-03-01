import { useActiveChatroomStore, useMembersStore } from "../../hooks/useStores";
import type { UpdateMembersMessage } from "../../types/ws-messages";

export const handleUpdateMembers = (message: UpdateMembersMessage) => {
  const chatroomId = useActiveChatroomStore.getState().activeChatroomId;

  if (message.chatroomId !== chatroomId) {
    console.error("received update members message for wrong chatroom");
    return;
  }

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
