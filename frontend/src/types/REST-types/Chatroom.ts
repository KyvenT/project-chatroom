export interface Chatroom {
  chatroomId: string;
  lastViewedAt: Date;
  unreadMessages: number;
  chatroomIndex: number;
  // the user's sidebar folder for this chatroom; null shows it under Chats
  folderId: string | null;
  chatroom: {
    title: string;
    privacy: ChatroomPrivacy;
    ownerId: string;
  };
}

export type ChatroomPrivacy =
  "INVITE_ONLY" | "INVITE_PLUS" | "JOINABLE" | "PUBLIC";

export interface JoinInfo {
  chatroomId: string;
  title: string;
  privacy: ChatroomPrivacy;
}

export interface JoinChatroom {
  joinedAt: Date;
  chatroomId: string;
  memberId: string;
  role?: string;
}

export interface ChatroomDetails {
  id: string;
  joinKey?: string; // only sent to the chatroom owner
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

export interface SidebarFolder {
  id: string;
  name: string;
  index: number;
}
