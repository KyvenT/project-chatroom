import {
  useMessagesStore,
  useTypingPresenceStore,
} from "../../hooks/useStores";
import type { ChatMessage } from "../../types/ws-messages";

export const handleChatMessage = (
  message: ChatMessage,
  chatroomId: string | undefined,
) => {
  console.log(message);
  if (message.message.chatroomId !== chatroomId) {
    console.error("received message from different chatroom");
    return;
  }
  const typingUsers = useTypingPresenceStore.getState().typingUsers;
  typingUsers.forEach((typingUser) => {
    if (typingUser.userId === message.message.senderUserId) {
      useTypingPresenceStore
        .getState()
        .removeTypingPresence(message.message.senderUserId);
    }
  });
  useMessagesStore.getState().addNewMessage(message.message);
};
