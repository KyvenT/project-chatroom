import { socketMap } from "../../lib/socketMaps.js";
import {
  MessagePayload,
  MessageReactionsPayload,
} from "../../types/payloads.js";
import { chatroomViewers, sendUnreadCounts } from "./chat-message.js";

const sendToViewers = (chatroomId: string, payload: object) => {
  const data = JSON.stringify(payload);
  chatroomViewers(chatroomId).forEach((userId) =>
    socketMap.getByKey(userId)?.send(data),
  );
};

// an edited message, for everyone showing the chatroom
export const sendMessageEdit = (message: MessagePayload) => {
  try {
    sendToViewers(message.chatroomId, { type: "message-edited", message });
  } catch (err) {
    console.error(err);
  }
};

// A deleted message, for everyone showing the chatroom. Anyone else may have
// counted it as unread, so they get their count again.
export const sendMessageDelete = async (
  chatroomId: string,
  messageId: string,
) => {
  try {
    sendToViewers(chatroomId, {
      type: "message-deleted",
      chatroomId,
      messageId,
    });
    await sendUnreadCounts(chatroomId, chatroomViewers(chatroomId));
  } catch (err) {
    console.error(err);
  }
};

// a message's reactions after one changed, for everyone showing the chatroom
export const sendMessageReactions = (change: MessageReactionsPayload) => {
  try {
    sendToViewers(change.chatroomId, { type: "message-reactions", ...change });
  } catch (err) {
    console.error(err);
  }
};
