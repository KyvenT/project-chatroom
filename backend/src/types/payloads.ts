import type { $Enums, InviteStatus, Status } from "@prisma/client";

export interface InvitePayload {
  sender: {
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
}

export interface ChatroomPayload {
  chatroomId: string;
  chatroom: {
    title: string;
  };
  lastViewedAt: Date;
  unreadMessages: number;
}

export interface JoinChatroomPayload {
  joinedAt: Date;
  chatroomId: string;
  memberId: string;
  role?: $Enums.ChatroomRoles;
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
