export type WSMessage =
  | WSAuthMessage
  | WSChatMessage
  | WSTypingPresenceMessage
  | WSUpdateActiveChatroomMessage
  | WSUpdateLastViewedAtMessage
  | WSUpdateWatchedChatroomsMessage;

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

// the chatrooms open in pop-outs, so their messages arrive live
export type WSUpdateWatchedChatroomsMessage = {
  type: "update-watched-chatrooms";
  chatroomIds: string[];
};
