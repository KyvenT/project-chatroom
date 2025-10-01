import { useMessagesStore } from "../hooks/useStores";
import type { ChatMessage } from "../types/ws-messages";

export const handleChatMessage = (message: ChatMessage) => {
  console.log(message);
  useMessagesStore.getState().addNewMessage(message.message);
};
