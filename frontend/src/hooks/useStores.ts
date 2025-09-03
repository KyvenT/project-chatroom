import { create } from "zustand";
import type { Chatroom } from "../types/Chatroom";
import type { Message } from "../types/Message";
import type { Invite } from "../types/Invite";

interface ChatroomState extends Chatroom {
  unreadMessages: number;
  lastViewedAt: string;
}

interface ChatroomListState {
  chatrooms: ChatroomState[];
  addChatroom: (newChatroom: ChatroomState) => void;
  emptyChatroomList: () => void;
}

export const useChatroomsStore = create<ChatroomListState>((set) => ({
  chatrooms: [],
  addChatroom: (newChatroom) =>
    set((state) => ({ chatrooms: [...state.chatrooms, newChatroom] })),
  emptyChatroomList: () => set({ chatrooms: [] }),
}));

interface MessageListState {
  messages: Message[];
  addNewMessage: (newMessage: Message) => void;
  addExistingMessages: (existingMessages: Message[]) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
}

export const useMessagesStore = create<MessageListState>((set) => ({
  messages: [],
  addNewMessage: (newMessage) =>
    set((state) => ({ messages: [newMessage, ...state.messages] })),
  addExistingMessages: (existingMessages) =>
    set((state) => ({ messages: [...state.messages, ...existingMessages] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
}));

interface InviteListState {
  invites: Invite[];
  addNewInvite: (newInvite: Invite) => void;
  setInvites: (invites: Invite[]) => void;
  clearInvites: () => void;
}

export const useInvitesStore = create<InviteListState>((set) => ({
  invites: [],
  addNewInvite: (newInvite) =>
    set((state) => ({ invites: [newInvite, ...state.invites] })),
  setInvites: (invites) => set({ invites }),
  clearInvites: () => set({ invites: [] }),
}));
