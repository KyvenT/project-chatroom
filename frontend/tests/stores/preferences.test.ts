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

describe("message chain minutes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("is 3 minutes by default", async () => {
    const store = await loadStore();
    expect(store.getState().messageChainMinutes).toBe(3);
  });

  it("keeps a saved value and falls back when it's unusable", async () => {
    localStorage.setItem(
      "preferences",
      JSON.stringify({ messageChainMinutes: 10 }),
    );
    expect((await loadStore()).getState().messageChainMinutes).toBe(10);

    for (const bad of [-1, 2.5, 999, "5", null]) {
      vi.resetModules();
      localStorage.setItem(
        "preferences",
        JSON.stringify({ messageChainMinutes: bad }),
      );
      expect((await loadStore()).getState().messageChainMinutes).toBe(3);
    }
  });

  it("saves changes alongside other preferences", async () => {
    const store = await loadStore();
    store.getState().setPreference("messageChainMinutes", 0);
    expect(JSON.parse(localStorage.getItem("preferences")!)).toEqual({
      syncFoldersWithHome: true,
      messageChainMinutes: 0,
    });
  });
});
