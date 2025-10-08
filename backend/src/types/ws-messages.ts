enum WSMessageTypes {
  Auth = "auth",
  Message = "message",
  UpdateActiveChatroom = "update-active-chatroom",
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
  type: "update-active-chatroom";
  chatroomId: string;
}

export interface TypingPresenceMessage {
  type: "typing-presence";
  chatroomId: string;
}

export interface UpdateLastViewedAtMessage {
  type: "update-last-viewed-at";
  chatroomId: string;
}
