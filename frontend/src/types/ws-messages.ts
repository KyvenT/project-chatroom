import type { MentionPayload } from "../ws-router/notification";
import type { Chatroom } from "./REST-types/Chatroom";
import type { ChatroomMember } from "./REST-types/ChatroomMember";
import type { Invite } from "./REST-types/Invite";
import type { Message } from "./REST-types/Message";

export interface ChatMessage {
  type: "chat-message";
  message: Message;
}

export interface NotificationMessage {
  type: "notification";
  notification: {
    id: string;
    type: "INVITE" | "MENTION" | "NEW_MESSAGE";
    createdAt: Date;
    payload: {
      mention?: MentionPayload;
      invite?: Invite;
    };
  };
}

export interface UpdateChatroomsMessage {
  type: "update-chatrooms";
  action: chatroomUpdateActions;
  chatroom?: Chatroom;
  chatroomId?: string;
}

export type chatroomUpdateActions = "JOIN" | "LEAVE" | "UPDATE";

export interface UpdateMembersMessage {
  type: "update-members";
  action: updateMembersActions;
  member?: {
    member: {
      status: "ONLINE" | "AWAY" | "OFFLINE";
      username: string;
    };
    memberId: string;
  };
  memberId?: string;
}

export type updateMembersActions = "JOIN" | "LEAVE";

export interface StatusMessage {
  type: "status-update";
  member: ChatroomMember;
}

export interface TypingPresenceMessage {
  type: "typing-presence";
  userId: string;
  username: string;
}

export interface FeedbackMessage {
  type: "feedback";
  message: string;
}
