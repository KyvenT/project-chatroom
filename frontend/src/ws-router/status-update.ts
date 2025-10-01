import { useMembersStore } from "../hooks/useStores";
import type { StatusMessage } from "../types/ws-messages";

export const handleStatusUpdate = (message: StatusMessage) => {
  useMembersStore.getState().updateMember(message.member);
};
