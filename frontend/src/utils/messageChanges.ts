import { API_URL } from "../env";
import type { Message, Reaction } from "../types/REST-types/Message";
import {
  applyMessageDelete,
  applyMessageEdit,
  applyMessageReactions,
} from "../ws-router/ws-routes/message-changes";
import { customMutation } from "./customMutation";

// Changes one of your messages' text; everyone showing the chatroom gets the
// change over the socket
export const editMessage = async (messageId: string, content: string) => {
  const message = await customMutation<Message>({
    fetchUrl: `${API_URL}/api/messages/${messageId}`,
    method: "PATCH",
    reqBody: { content },
  });
  applyMessageEdit(message);
  return message;
};

// Deletes your message, or any message in a chatroom you moderate
export const deleteMessage = async (messageId: string) => {
  const deleted = await customMutation<{
    chatroomId: string;
    messageId: string;
  }>({
    fetchUrl: `${API_URL}/api/messages/${messageId}`,
    method: "DELETE",
  });
  applyMessageDelete(deleted.chatroomId, deleted.messageId);
};

// Reacts to a message with an emoji, or takes your reaction back
export const setReaction = async (
  messageId: string,
  emoji: string,
  reacted: boolean,
) => {
  const change = await customMutation<{
    chatroomId: string;
    messageId: string;
    reactions: Reaction[];
  }>({
    fetchUrl: `${API_URL}/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    method: reacted ? "PUT" : "DELETE",
  });
  applyMessageReactions(change.chatroomId, change.messageId, change.reactions);
};
