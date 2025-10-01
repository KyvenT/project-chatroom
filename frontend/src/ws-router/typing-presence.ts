import type { TypingPresenceMessage } from "../types/ws-messages";

export const handleTypingPresence = (message: TypingPresenceMessage) => {
  console.log("received typing presence:", message.username);
};
