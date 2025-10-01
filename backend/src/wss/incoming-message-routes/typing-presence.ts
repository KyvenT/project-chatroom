import WebSocket from "ws";
import { socketMap } from "../../lib/socketMaps.js";
import { TypingPresenceMessage } from "../../types/ws-messages.js";
import { sendTypingPresence } from "../outgoing-messages/typing-presence.js";

export const handleTypingPresence = (
  message: TypingPresenceMessage,
  ws: WebSocket
) => {
  const { chatroomId } = message;
  const memberId = socketMap.getByValue(ws);

  if (!memberId) {
    console.error("uh oh socket not mapped to a user");
    return;
  }

  console.log("typing presence: ", chatroomId, memberId);

  sendTypingPresence(chatroomId, memberId);
};
