import { create } from "zustand";
import type { Chatroom } from "../types/REST-types/Chatroom";
import type { Message } from "../types/REST-types/Message";
import type { Invite } from "../types/REST-types/Invite";
import type { ChatroomMember } from "../types/REST-types/ChatroomMember";
import type { TypingPresence } from "../types/ws-messages";
import type { UserAuth } from "../types/REST-types/User";

interface ChatroomListState {
  chatrooms: Chatroom[];
  addChatroom: (newChatroom: Chatroom) => void;
  removeChatroom: (chatroomId: string) => void;
  emptyChatroomList: () => void;
  setChatroomList: (chatrooms: Chatroom[]) => void;
  updateChatroomUnread: (newUnreadCount: number, chatroomId: string) => void;
  updateChatroom: (updatedChatroom: Chatroom) => void;
  swapChatroomOrder: (
    firstChatroom: Chatroom,
    secondChatroom: Chatroom,
  ) => void;
  setChatroomFolder: (chatroomId: string, folderId: string | null) => void;
  // puts these chatrooms in this order, within the places they already hold
  reorderChatrooms: (chatroomIds: string[]) => void;
  clearFolder: (folderId: string) => void;
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
  // merged so fields the update doesn't carry (e.g. unreadMessages) are kept
  updateChatroom: (updatedChatroom) =>
    set((state) => ({
      chatrooms: state.chatrooms.map((chatroom) => {
        if (chatroom.chatroomId === updatedChatroom.chatroomId) {
          return { ...chatroom, ...updatedChatroom };
        }
        return chatroom;
      }),
    })),
  setChatroomFolder: (chatroomId, folderId) =>
    set((state) => ({
      chatrooms: state.chatrooms.map((chatroom) =>
        chatroom.chatroomId === chatroomId
          ? { ...chatroom, folderId }
          : chatroom,
      ),
    })),
  reorderChatrooms: (chatroomIds) =>
    set((state) => {
      const moving = new Set(chatroomIds);
      const byId = new Map(state.chatrooms.map((c) => [c.chatroomId, c]));
      const slots = state.chatrooms
        .filter((c) => moving.has(c.chatroomId))
        .map((c) => c.chatroomIndex);
      let next = 0;
      return {
        chatrooms: state.chatrooms.map((chatroom) => {
          if (!moving.has(chatroom.chatroomId)) return chatroom;
          const placed = byId.get(chatroomIds[next])!;
          return { ...placed, chatroomIndex: slots[next++] };
        }),
      };
    }),
  clearFolder: (folderId) =>
    set((state) => ({
      chatrooms: state.chatrooms.map((chatroom) =>
        chatroom.folderId === folderId
          ? { ...chatroom, folderId: null }
          : chatroom,
      ),
    })),
  swapChatroomOrder: (firstChatroom, secondChatroom) =>
    set((state) => ({
      chatrooms: state.chatrooms.map((chatroom) => {
        if (chatroom.chatroomId === firstChatroom.chatroomId) {
          return {
            ...secondChatroom,
            chatroomIndex: firstChatroom.chatroomIndex,
          };
        }
        if (chatroom.chatroomId === secondChatroom.chatroomId) {
          return {
            ...firstChatroom,
            chatroomIndex: secondChatroom.chatroomIndex,
          };
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
      invites: state.invites.filter((invite) => invite.id !== inviteId),
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

// how long someone shows as typing after their last typing message
export const TYPING_TIMEOUT = 3000;

// each typing entry's removal timer, by chatroom and user
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const typingKey = (chatroomId: string, userId: string) =>
  `${chatroomId}:${userId}`;

interface TypingPresenceState {
  // who is typing, in any chatroom the user has open (page or pop-outs)
  typingUsers: TypingPresence[];
  // (re)starts showing a user as typing in a chatroom
  addTypingPresence: (typingUser: TypingPresence) => void;
  removeTypingPresence: (userId: string, chatroomId: string) => void;
}

export const useTypingPresenceStore = create<TypingPresenceState>((set) => {
  const remove = (userId: string, chatroomId: string) => {
    const key = typingKey(chatroomId, userId);
    clearTimeout(typingTimers.get(key));
    typingTimers.delete(key);
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (t) => !(t.userId === userId && t.chatroomId === chatroomId),
      ),
    }));
  };

  return {
    typingUsers: [],
    addTypingPresence: (typingUser) => {
      const { userId, chatroomId } = typingUser;
      const key = typingKey(chatroomId, userId);
      clearTimeout(typingTimers.get(key));
      typingTimers.set(
        key,
        setTimeout(() => remove(userId, chatroomId), TYPING_TIMEOUT),
      );
      set((state) =>
        state.typingUsers.some(
          (t) => t.userId === userId && t.chatroomId === chatroomId,
        )
          ? state
          : { typingUsers: [...state.typingUsers, typingUser] },
      );
    },
    removeTypingPresence: remove,
  };
});

// the users typing in a chatroom
export const useTypingUsers = (chatroomId: string | undefined) => {
  const typingUsers = useTypingPresenceStore((state) => state.typingUsers);
  return typingUsers.filter((t) => t.chatroomId === chatroomId);
};

interface AuthState {
  user: UserAuth;
  // true once the startup refresh-token sign in has finished (either way)
  sessionChecked: boolean;
  handleSignIn: (user: UserAuth) => void;
  handleLogOut: () => void;
  setSessionChecked: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { userId: "", username: "", token: "", isGuest: true },
  sessionChecked: false,
  handleSignIn: (user) => set({ user }),
  handleLogOut: () =>
    set({ user: { userId: "", username: "", token: "", isGuest: true } }),
  setSessionChecked: () => set({ sessionChecked: true }),
}));

export const isLoggedInSelector = (state: AuthState) => !!state.user.token;

interface ActiveChatroomState {
  activeChatroomId: string | undefined;
  setActiveChatroomId: (chatroomId: string | undefined) => void;
}

export const useActiveChatroomStore = create<ActiveChatroomState>((set) => ({
  activeChatroomId: undefined,
  setActiveChatroomId: (chatroomId) => set({ activeChatroomId: chatroomId }),
}));
