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
  refreshToken: string;
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
  folderId: string | null;
  chatroom: {
    title: string;
    privacy: ChatroomPrivacy;
    ownerId: string;
  };
}

export interface JoinInfoPayload {
  chatroomId: string;
  title: string;
  privacy: ChatroomPrivacy;
}

export interface JoinChatroomPayload {
  joinedAt: Date;
  chatroomId: string;
  memberId: string;
  role?: ChatroomRoles;
}

export interface ChatroomDetailsPayload {
  id: string;
  joinKey?: string; // only present for the chatroom owner
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
  chatrooms: PinnedChatroomPayload[];
}

export interface PinnedChatroomPayload {
  chatroomId: string;
  chatroom: {
    title: string;
  };
  pinnedIndex: number;
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
  // null when the sender's account has been deleted
  senderUser: {
    id: string;
    username: string;
  } | null;
  id: string;
  chatroomId: string;
  createdAt: Date;
  content: string;
  senderUserId: string | null;
  editedAt: Date | null;
  attachment: AttachmentPayload | null;
}

// a message's file, without its bytes (those are downloaded separately)
export interface AttachmentPayload {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
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
  // another member's details, so not their email
  member: Omit<UserDetailsPayload, "email">;
}

export interface FolderPayload {
  id: string;
  name: string;
  index: number;
}
