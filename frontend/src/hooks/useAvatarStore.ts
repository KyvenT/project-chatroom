import { create } from "zustand";

// Profile pictures that changed while the app was open, by user id. Messages
// and member lists carry the version they were loaded with; these take
// precedence so a change shows everywhere at once.
interface AvatarState {
  // when each picture last changed, or null once it was removed
  versions: Record<string, string | null>;
  setAvatarVersion: (userId: string, avatarUpdatedAt: string | null) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  versions: {},
  setAvatarVersion: (userId, avatarUpdatedAt) =>
    set((state) => ({
      versions: { ...state.versions, [userId]: avatarUpdatedAt },
    })),
}));
