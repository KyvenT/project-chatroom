export interface Chatroom {
  chatroomId: string;
  chatroom: {
    title: string;
    allowMembersToInvite: boolean;
    ownerId: string;
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
