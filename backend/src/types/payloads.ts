import type { InviteStatus, Status } from "@prisma/client";

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
}

export interface JoinChatroomPayload {
  chatroom: {
    title: string;
  };
  chatroomId: string;
  joinedAt: Date;
  memberId: string;
}

export interface MembersPayload {
  member: {
    status: Status;
    username: string;
  };
  memberId: string;
}
