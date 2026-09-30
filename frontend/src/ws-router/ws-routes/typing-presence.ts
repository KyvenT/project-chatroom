import { useTypingPresenceStore } from "../../hooks/useStores";
import type { TypingPresenceMessage } from "../../types/ws-messages";

// the server only sends these for chatrooms the user has open (the page or
// a pop-out), and each place shows its own chatroom's
export const handleTypingPresence = (message: TypingPresenceMessage) => {
  const { userId, username, chatroomId } = message;
  useTypingPresenceStore
    .getState()
    .addTypingPresence({ userId, username, chatroomId });
};
