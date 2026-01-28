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
  lastViewedAt: Date;
  unreadMessages: number;
  chatroomIndex: number;
  chatroom: {
    title: string;
    privacy: ChatroomPrivacy;
    ownerId: string;
  };
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

export interface PinnedGroupsPayload {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  pinnedChatrooms: PinnedChatroomPayload[];
}

export interface PinnedChatroomPayload {
  chatroomId: string;
  chatroom: {
    title: string;
  };
}

export interface MembersPayload {
  member: {
    status: Status;
    username: string;
  };
  memberId: string;
  role: ChatroomRoles;
}

export interface MessagePayload {
  senderUser: {
    id: string;
    username: string;
  };
  id: string;
  chatroomId: string;
  createdAt: Date;
  content: string;
  senderUserId: string;
  editedAt: Date | null;
}

export interface MentionPayload {
  chatroomId: string;
  senderId: string;
  messageId: string;
}

export interface UserDetailsPayload {
  id: string;
  email: string | null;
  username: string;
  status: Status;
  createdAt: Date;
  isGuest: boolean;
}

export interface ChatroomMemberDetailsPayload {
  joinedAt: Date;
  member: UserDetailsPayload;
}
