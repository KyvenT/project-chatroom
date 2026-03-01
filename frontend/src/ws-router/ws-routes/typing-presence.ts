import {
  useActiveChatroomStore,
  useTypingPresenceStore,
} from "../../hooks/useStores";
import type { TypingPresenceMessage } from "../../types/ws-messages";

export const handleTypingPresence = (message: TypingPresenceMessage) => {
  const chatroomId = useActiveChatroomStore.getState().activeChatroomId;

  if (message.chatroomId !== chatroomId) {
    console.error("received typing presence from different chatroom");
    return;
  }
  console.log("received typing presence:", message.username);
  const typingUsers = useTypingPresenceStore.getState().typingUsers;
  typingUsers.forEach((typingUser) => {
    if (typingUser.userId === message.userId) {
      useTypingPresenceStore.getState().removeTypingPresence(message.userId);
    }
  });
  useTypingPresenceStore.getState().addTypingPresence({ ...message });
};
