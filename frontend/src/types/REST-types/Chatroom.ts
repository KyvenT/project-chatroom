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

export interface ChatroomDetails {
  id: string;
  title: string;
  ownerId: string;
  allowGuests: boolean;
  allowJoinByLink: boolean;
  allowMembersToInvite: boolean;
  createdAt: Date;
  owner: {
    username: string;
  };
}
