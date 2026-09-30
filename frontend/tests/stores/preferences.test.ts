import { beforeEach, describe, expect, it, vi } from "vitest";

// the store reads saved preferences when it's first loaded
const loadStore = async () =>
  (await import("../../src/hooks/usePreferencesStore")).usePreferencesStore;

describe("preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("syncs sidebar folders with the home page by default", async () => {
    const store = await loadStore();
    expect(store.getState().syncFoldersWithHome).toBe(true);
  });

  it("keeps a choice the user made", async () => {
    localStorage.setItem(
      "preferences",
      JSON.stringify({ syncFoldersWithHome: false }),
    );
    const store = await loadStore();
    expect(store.getState().syncFoldersWithHome).toBe(false);
  });
});
