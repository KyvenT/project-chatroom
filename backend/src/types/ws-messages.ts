enum WSMessageTypes {
  Auth = "auth",
  Message = "message",
  UpdateActiveChatroom = "update-active-chatroom",
  TypingPresence = "typing-presence",
  UpdateLastViewedAt = "update-last-viewed-at",
}

export interface AuthMessage {
  type: WSMessageTypes.Auth;
  token: string;
}

export interface ChatMessage {
  type: WSMessageTypes.Message;
  content: string;
  chatroomId: string;
}

export interface UpdateActiveChatroomMessage {
  type: WSMessageTypes.UpdateActiveChatroom;
  chatroomId: string;
}

export interface TypingPresenceMessage {
  type: WSMessageTypes.TypingPresence;
  chatroomId: string;
}

export interface UpdateLastViewedAtMessage {
  type: WSMessageTypes.UpdateLastViewedAt;
  chatroomId: string;
}
