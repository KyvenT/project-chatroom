import { useMembersStore } from "../../hooks/useStores";
import type { StatusMessage } from "../../types/ws-messages";

export const handleStatusUpdate = (
  message: StatusMessage,
  chatroomId: string | undefined,
) => {
  if (message.chatroomId !== chatroomId) {
    console.error("received status update for wrong chatroom");
    return;
  }
  useMembersStore.getState().updateMember(message.member);
};
