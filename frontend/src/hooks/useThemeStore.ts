import { create } from "zustand";
import {
  isHexColor,
  type ColorOverrides,
  type EditableColor,
} from "../styles/theme";

// Custom colors are a per-browser preference
const STORAGE_KEY = "themeColors";

const load = (): ColorOverrides => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return typeof stored === "object" && stored !== null ? stored : {};
  } catch {
    return {};
  }
};

const save = (overrides: ColorOverrides) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // storage unavailable; colors apply until the page is reloaded
  }
};

interface ThemeState {
  overrides: ColorOverrides;
  setColor: (key: EditableColor, value: string) => void;
  resetColor: (key: EditableColor) => void;
  resetAll: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  overrides: load(),
  setColor: (key, value) =>
    set((state) => {
      if (!isHexColor(value)) return state;
      const overrides = { ...state.overrides, [key]: value.toLowerCase() };
      save(overrides);
      return { overrides };
    }),
  resetColor: (key) =>
    set((state) => {
      const overrides = { ...state.overrides };
      delete overrides[key];
      save(overrides);
      return { overrides };
    }),
  resetAll: () => {
    save({});
    set({ overrides: {} });
  },
}));
