import { create } from "zustand";
import type { Chatroom } from "../types/REST-types/Chatroom";
import type { Message } from "../types/REST-types/Message";
import type { Invite } from "../types/REST-types/Invite";
import type { ChatroomMember } from "../types/REST-types/ChatroomMember";
import type { TypingPresence } from "../types/ws-messages";

interface ChatroomListState {
  chatrooms: Chatroom[];
  addChatroom: (newChatroom: Chatroom) => void;
  removeChatroom: (chatroomId: string) => void;
  emptyChatroomList: () => void;
  setChatroomList: (chatrooms: Chatroom[]) => void;
  updateChatroomUnread: (newUnreadCount: number, chatroomId: string) => void;
  updateChatroom: (updatedChatroom: Chatroom) => void;
}

export const useChatroomsStore = create<ChatroomListState>((set) => ({
  chatrooms: [],
  addChatroom: (newChatroom) =>
    set((state) => ({ chatrooms: [...state.chatrooms, newChatroom] })),
  removeChatroom: (chatroomId: string) =>
    set((state) => ({
      chatrooms: state.chatrooms.filter(
        (chatroom) => chatroom.chatroomId !== chatroomId,
      ),
    })),
  emptyChatroomList: () => set({ chatrooms: [] }),
  setChatroomList: (chatrooms) => set({ chatrooms }),
  updateChatroomUnread: (newUnreadCount, chatroomId) =>
    set((state) => ({
      chatrooms: state.chatrooms.map((chatroom) => {
        if (chatroom.chatroomId === chatroomId) {
          return { ...chatroom, unreadMessages: newUnreadCount };
        }
        return chatroom;
      }),
    })),
  updateChatroom: (updatedChatroom) =>
    set((state) => ({
      chatrooms: state.chatrooms.map((chatroom) => {
        if (chatroom.chatroomId === updatedChatroom.chatroomId) {
          return updatedChatroom;
        }
        return chatroom;
      }),
    })),
}));

interface MessageListState {
  messages: Message[];
  addNewMessage: (newMessage: Message) => void;
  addPreviousMessages: (existingMessages: Message[]) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
}

export const useMessagesStore = create<MessageListState>((set) => ({
  messages: [],
  addNewMessage: (newMessage) =>
    set((state) => ({ messages: [newMessage, ...state.messages] })),
  addPreviousMessages: (existingMessages) =>
    set((state) => ({ messages: [...state.messages, ...existingMessages] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
}));

interface InviteListState {
  invites: Invite[];
  addNewInvite: (newInvite: Invite) => void;
  setInvites: (invites: Invite[]) => void;
  clearInvites: () => void;
  removeInvite: (inviteId: string) => void;
}

export const useInvitesStore = create<InviteListState>((set) => ({
  invites: [],
  addNewInvite: (newInvite) =>
    set((state) => ({ invites: [newInvite, ...state.invites] })),
  setInvites: (invites) => set({ invites }),
  clearInvites: () => set({ invites: [] }),
  removeInvite: (inviteId) =>
    set((state) => ({
      invites: state.invites.filter((invite) => {
        invite.id !== inviteId;
      }),
    })),
}));

interface MembersListState {
  members: ChatroomMember[];
  addNewMember: (newMember: ChatroomMember) => void;
  removeMember: (memberId: string) => void;
  setMembers: (membersList: ChatroomMember[]) => void;
  updateMember: (member: ChatroomMember) => void;
}

export const useMembersStore = create<MembersListState>((set) => ({
  members: [],
  addNewMember: (newMember) =>
    set((state) => ({ members: [...state.members, newMember] })),
  removeMember: (memberId) =>
    set((state) => ({
      members: state.members.filter((member) => member.memberId !== memberId),
    })),
  setMembers: (membersList) => set({ members: membersList }),
  clearMembers: () => set({ members: [] }),
  updateMember: (member) =>
    set((state) => ({
      members: state.members.map((mem) => {
        if (member.memberId === mem.memberId) {
          return {
            ...mem,
            member: { ...mem.member, status: member.member.status },
          };
        }
        return mem;
      }),
    })),
}));

interface TypingPresenceState {
  typingUsers: TypingPresence[];
  addTypingPresence: (typingUser: TypingPresence) => void;
  removeTypingPresence: (userId: string) => void;
  popTypingUser: () => void;
}

export const useTypingPresenceStore = create<TypingPresenceState>((set) => ({
  typingUsers: [],
  addTypingPresence: (typingUser) =>
    set((state) => ({ typingUsers: [...state.typingUsers, typingUser] })),
  removeTypingPresence: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (typingUser) => typingUser.userId !== userId,
      ),
    })),
  popTypingUser: () => {
    set((state) => ({
      typingUsers: state.typingUsers.slice(1),
    }));
  },
}));
