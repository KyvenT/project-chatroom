export interface Chatroom {
  chatroomId: string;
  lastViewedAt: Date;
  unreadMessages: number;
  chatroomIndex: number;
  chatroom: {
    title: string;
    privacy: ChatroomPrivacy;
    ownerId: string;
  };
}

export type ChatroomPrivacy =
  | "INVITE_ONLY"
  | "INVITE_PLUS"
  | "JOINABLE"
  | "PUBLIC";

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

export interface PinnedGroup {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  chatrooms: PinnedChatroom[];
}

export interface PinnedChatroom {
  chatroomId: string;
  chatroom: {
    title: string;
  };
  pinnedIndex: number;
}
