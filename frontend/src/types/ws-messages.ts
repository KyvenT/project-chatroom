export interface ChatMessage {
  type: "message";
  content: string;
}

export interface FeedbackMessage {
  type: "feedback";
  message: string;
}

export interface UpdateUnreadMessage {
  type: "unread-update";
  chatroomId: string;
  unreadMessages: number;
}
