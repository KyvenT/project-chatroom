export interface Chatroom {
  chatroomId: string;
  chatroom: {
    title: string;
  };
  lastViewedAt: Date;
  unreadMessages: number;
}

export interface JoinChatroom {
  joinedAt: Date;
  chatroomId: string;
  memberId: string;
  role?: string;
}
