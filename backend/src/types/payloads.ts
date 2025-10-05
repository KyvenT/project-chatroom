import type {
  InviteStatus,
  Status,
  ChatroomPrivacy,
  ChatroomRoles,
  Message,
} from "@prisma/client";

export interface AuthPayload {
  token: string;
  userId: string;
  username: string;
  isGuest: boolean;
}

export interface InvitePayload {
  sender: {
    username: string;
  };
  receiver: {
    username: string;
  };
  chatroom: {
    title: string;
  };
  id: string;
  senderId: string;
  receiverId: string;
  chatroomId: string;
  status: InviteStatus;
  sentAt: Date;
}

export interface ChatroomPayload {
  chatroomId: string;
  chatroom: {
    title: string;
    privacy: ChatroomPrivacy;
    ownerId: string;
  };
  lastViewedAt: Date;
  unreadMessages: number;
}

export interface JoinChatroomPayload {
  joinedAt: Date;
  chatroomId: string;
  memberId: string;
  role?: ChatroomRoles;
}

export interface ChatroomDetailsPayload {
  id: string;
  title: string;
  ownerId: string;
  privacy: ChatroomPrivacy;
  createdAt: Date;
  owner: {
    username: string;
  };
}

export interface PinnedChatroomPayload {
  chatroomId: string;
  chatroom: {
    title: string;
    messages: Message[];
  };
}

export interface MembersPayload {
  member: {
    status: Status;
    username: string;
  };
  memberId: string;
}

export interface MessagePayload {
  senderUser: {
    username: string;
  };
  id: string;
  chatroomId: string;
  createdAt: Date;
  content: string;
  senderUserId: string;
  editedAt: Date | null;
}

export interface UserDetailsPayload {
  id: string;
  email: string | null;
  username: string;
  status: Status;
  createdAt: Date;
  isGuest: boolean;
}
