import { useInvitesStore } from "../../hooks/useStores";
import type { UpdateInvitesMessage } from "../../types/ws-messages";

export const handleUpdateInvites = (message: UpdateInvitesMessage) => {
  switch (message.action) {
    case "ADD":
      if (!message.invite) {
        console.error("missing invite to add");
        return;
      }
      useInvitesStore.getState().addNewInvite(message.invite);
      break;
    case "DELETE":
      if (!message.inviteId) {
        console.error("missing invite id to remove");
        return;
      }
      useInvitesStore.getState().removeInvite(message.inviteId);
      break;
    default:
      console.error("received unknown invite update action");
  }
};
