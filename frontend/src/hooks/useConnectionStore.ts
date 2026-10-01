import { create } from "zustand";

// Bumped each time the websocket (re)authenticates, so state the server
// keeps per connection (active chatroom, watched pop-outs) can be resent
interface ConnectionState {
  connectionId: number;
  connected: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connectionId: 0,
  connected: () => set((state) => ({ connectionId: state.connectionId + 1 })),
}));
