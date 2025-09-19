export interface Chatroom {
  chatroomId: string;
  chatroom: {
    title: string;
    privacy: ChatroomPrivacy;
    ownerId: string;
  };
  lastViewedAt: Date;
  unreadMessages: number;
}

export type ChatroomPrivacy = "INVITE_ONLY" | "INVITE_PLUS" | "JOINABLE" | "PUBLIC"

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
  privacy: ChatroomPrivacy;
  createdAt: Date;
  owner: {
    username: string;
  };
}
