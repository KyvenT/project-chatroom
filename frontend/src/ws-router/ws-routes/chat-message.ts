import {
  useActiveChatroomStore,
  useMessagesStore,
  useTypingPresenceStore,
} from "../../hooks/useStores";
import type { ChatMessage } from "../../types/ws-messages";
import { usePopoutStore } from "../../hooks/usePopoutStore";

export const handleChatMessage = (message: ChatMessage) => {
  const chatroomId = useActiveChatroomStore.getState().activeChatroomId;

  console.log(message);
  // an open pop-out of the chatroom shows it too
  usePopoutStore.getState().addLiveMessage(message.message);

  // messages for other chatrooms are only for pop-outs
  if (message.message.chatroomId !== chatroomId) return;
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
