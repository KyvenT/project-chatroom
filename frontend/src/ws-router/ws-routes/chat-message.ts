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

  // whoever sent it has stopped typing
  const { senderUserId } = message.message;
  if (senderUserId) {
    useTypingPresenceStore
      .getState()
      .removeTypingPresence(senderUserId, message.message.chatroomId);
  }

  // messages for other chatrooms are only for pop-outs
  if (message.message.chatroomId !== chatroomId) return;
  useMessagesStore.getState().addNewMessage(message.message);
};
