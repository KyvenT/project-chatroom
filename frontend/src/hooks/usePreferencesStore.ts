import { create } from "zustand";

// Per-browser preferences shown on the settings page
const STORAGE_KEY = "preferences";

interface Preferences {
  // the home page shows sidebar folders instead of pinned groups
  syncFoldersWithHome: boolean;
}

// used until the user changes a setting (their choice is then remembered)
const defaults: Preferences = {
  syncFoldersWithHome: true,
};

const load = (): Preferences => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return { ...defaults, ...(typeof stored === "object" ? stored : {}) };
  } catch {
    return defaults;
  }
};

interface PreferencesState extends Preferences {
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...load(),
  setPreference: (key, value) => {
    set({ [key]: value } as Partial<Preferences>);
    const state = get();
    const preferences = Object.fromEntries(
      Object.keys(defaults).map((k) => [k, state[k as keyof Preferences]]),
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // storage unavailable; the preference lasts until the page is reloaded
    }
  },
}));
