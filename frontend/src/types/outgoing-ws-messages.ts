export type WSMessage =
  | WSAuthMessage
  | WSChatMessage
  | WSTypingPresenceMessage
  | WSUpdateActiveChatroomMessage
  | WSUpdateLastViewedAtMessage;

export type WSAuthMessage = {
  type: "auth";
  token: string;
};

export type WSChatMessage = {
  type: "message";
  content: string;
  chatroomId: string;
};

export type WSTypingPresenceMessage = {
  type: "typing-presence";
  chatroomId: string;
};

export type WSUpdateActiveChatroomMessage = {
  type: "update-active-chatroom";
  chatroomId: string;
};

export type WSUpdateLastViewedAtMessage = {
  type: "update-last-viewed-at";
  chatroomId: string;
};
