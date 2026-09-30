import { create } from "zustand";

// Per-browser preferences shown on the settings page
const STORAGE_KEY = "preferences";

interface Preferences {
  // the home page shows sidebar folders instead of pinned groups
  syncFoldersWithHome: boolean;
  // a message sent this many minutes or less after the same person's
  // previous one is shown under it without its own name; 0 turns this off
  messageChainMinutes: number;
}

export const MAX_MESSAGE_CHAIN_MINUTES = 60;

// used until the user changes a setting (their choice is then remembered)
const defaults: Preferences = {
  syncFoldersWithHome: true,
  messageChainMinutes: 3,
};

// saved values that aren't a usable number of minutes fall back to the default
const validChainMinutes = (value: unknown) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_MESSAGE_CHAIN_MINUTES
    ? value
    : defaults.messageChainMinutes;

const load = (): Preferences => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    const loaded = {
      ...defaults,
      ...(typeof stored === "object" ? stored : {}),
    };
    return {
      ...loaded,
      messageChainMinutes: validChainMinutes(loaded.messageChainMinutes),
    };
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
