export interface Chatroom {
  chatroomId: string;
  chatroom: {
    title: string;
  };
  lastViewedAt: Date;
  unreadMessages: number;
}

export interface JoinChatroom {
  title: string;
  chatroomId: string;
  memberId: string;
  joinedAt: Date;
}
