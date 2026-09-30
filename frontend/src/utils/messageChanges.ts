import { API_URL } from "../env";
import type { Message } from "../types/REST-types/Message";
import {
  applyMessageDelete,
  applyMessageEdit,
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
