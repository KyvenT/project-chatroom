import { create } from "zustand";
import type { Message } from "../types/REST-types/Message";

// Chat pop-outs: small chat windows docked at the bottom of the screen, or
// tabs in a picture-in-picture window that stays on top of other apps
export const MAX_POPOUTS = 3;
export const MAX_WINDOW_TABS = 5;

// which pop-outs are open is remembered per browser
const STORAGE_KEY = "chatPopouts";

export interface Popout {
  chatroomId: string;
  minimized: boolean;
}

const load = (): Popout[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored)
      ? stored
          .filter((p) => typeof p?.chatroomId === "string")
          .slice(-MAX_POPOUTS)
      : [];
  } catch {
    return [];
  }
};

const save = (popouts: Popout[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(popouts));
  } catch {
    // storage unavailable; pop-outs close when the page reloads
  }
};

interface PopoutState {
  // oldest first; the newest is docked furthest right
  popouts: Popout[];
  // messages that arrived while each pop-out was open, newest first
  liveMessages: Record<string, Message[]>;
  // the picture-in-picture window and the chats in it; it can't be reopened
  // after a reload, so none of this is remembered
  chatWindow: Window | null;
  windowTabs: string[];
  activeWindowTab: string | null;
  open: (chatroomId: string) => void;
  close: (chatroomId: string) => void;
  setMinimized: (chatroomId: string, minimized: boolean) => void;
  addLiveMessage: (message: Message) => void;
  updateLiveMessage: (message: Message) => void;
  removeLiveMessage: (chatroomId: string, messageId: string) => void;
  setChatWindow: (chatWindow: Window) => void;
  openInWindow: (chatroomId: string) => void;
  setActiveWindowTab: (chatroomId: string) => void;
  closeWindowTab: (chatroomId: string) => void;
  // the window closed (by the user or the app)
  clearWindow: () => void;
}

export const usePopoutStore = create<PopoutState>((set) => {
  const update = (
    state: PopoutState,
    popouts: Popout[],
    liveMessages = state.liveMessages,
  ) => {
    save(popouts);
    return { popouts, liveMessages };
  };

  // live messages are only kept while a pop-out's messages are showing;
  // opening it again loads them fresh
  const withoutLive = (state: PopoutState, chatroomId: string) => {
    const rest = { ...state.liveMessages };
    delete rest[chatroomId];
    return rest;
  };

  // the window's tabs without chatroomId, closing the window if none are left
  const withoutTab = (state: PopoutState, chatroomId: string) => {
    const windowTabs = state.windowTabs.filter((id) => id !== chatroomId);
    if (windowTabs.length === 0) state.chatWindow?.close();
    return {
      windowTabs,
      activeWindowTab:
        state.activeWindowTab === chatroomId
          ? (windowTabs[windowTabs.length - 1] ?? null)
          : state.activeWindowTab,
      chatWindow: windowTabs.length === 0 ? null : state.chatWindow,
    };
  };

  return {
    popouts: load(),
    liveMessages: {},
    chatWindow: null,
    windowTabs: [],
    activeWindowTab: null,

    open: (chatroomId) =>
      set((state) => {
        const others = state.popouts.filter((p) => p.chatroomId !== chatroomId);
        // opening one again brings it to the front, expanded
        const popouts = [...others, { chatroomId, minimized: false }].slice(
          -MAX_POPOUTS,
        );
        // a chat is either docked or in the window, not both
        return {
          ...update(state, popouts),
          ...(state.windowTabs.includes(chatroomId)
            ? withoutTab(state, chatroomId)
            : {}),
        };
      }),

    setChatWindow: (chatWindow) => set({ chatWindow }),

    openInWindow: (chatroomId) =>
      set((state) => {
        const windowTabs = [
          ...state.windowTabs.filter((id) => id !== chatroomId),
          chatroomId,
        ].slice(-MAX_WINDOW_TABS);
        return {
          ...update(
            state,
            state.popouts.filter((p) => p.chatroomId !== chatroomId),
          ),
          windowTabs,
          activeWindowTab: chatroomId,
        };
      }),

    setActiveWindowTab: (chatroomId) =>
      set((state) =>
        state.windowTabs.includes(chatroomId)
          ? {
              activeWindowTab: chatroomId,
              liveMessages: withoutLive(state, chatroomId),
            }
          : state,
      ),

    closeWindowTab: (chatroomId) =>
      set((state) => ({
        ...withoutTab(state, chatroomId),
        liveMessages: withoutLive(state, chatroomId),
      })),

    clearWindow: () =>
      set((state) => {
        const liveMessages = { ...state.liveMessages };
        state.windowTabs.forEach((id) => delete liveMessages[id]);
        return {
          chatWindow: null,
          windowTabs: [],
          activeWindowTab: null,
          liveMessages,
        };
      }),

    close: (chatroomId) =>
      set((state) =>
        update(
          state,
          state.popouts.filter((p) => p.chatroomId !== chatroomId),
          withoutLive(state, chatroomId),
        ),
      ),

    setMinimized: (chatroomId, minimized) =>
      set((state) =>
        update(
          state,
          state.popouts.map((p) =>
            p.chatroomId === chatroomId ? { ...p, minimized } : p,
          ),
          withoutLive(state, chatroomId),
        ),
      ),

    updateLiveMessage: (message) =>
      set((state) => {
        const current = state.liveMessages[message.chatroomId];
        if (!current) return state;
        return {
          liveMessages: {
            ...state.liveMessages,
            [message.chatroomId]: current.map((m) =>
              m.id === message.id ? message : m,
            ),
          },
        };
      }),
    removeLiveMessage: (chatroomId, messageId) =>
      set((state) => {
        const current = state.liveMessages[chatroomId];
        if (!current) return state;
        return {
          liveMessages: {
            ...state.liveMessages,
            [chatroomId]: current.filter((m) => m.id !== messageId),
          },
        };
      }),
    addLiveMessage: (message) =>
      set((state) => {
        const popout = state.popouts.find(
          (p) => p.chatroomId === message.chatroomId,
        );
        const showing =
          (popout && !popout.minimized) ||
          state.activeWindowTab === message.chatroomId;
        if (!showing) return state;
        const current = state.liveMessages[message.chatroomId] ?? [];
        if (current.some((m) => m.id === message.id)) return state;
        return {
          liveMessages: {
            ...state.liveMessages,
            [message.chatroomId]: [message, ...current],
          },
        };
      }),
  };
});
