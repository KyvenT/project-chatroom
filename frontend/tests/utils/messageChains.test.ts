import { describe, expect, it } from "vitest";
import { continuesChain } from "../../src/utils/messageChains";

const at = (minute: number, senderUserId: string | null = "u1") => ({
  senderUserId,
  createdAt: new Date(2025, 0, 1, 12, minute),
});

describe("continuesChain", () => {
  it("chains the same person's messages within the time", () => {
    expect(continuesChain(at(3), at(0), 3)).toBe(true);
    expect(continuesChain(at(1), at(0), 3)).toBe(true);
  });

  it("starts a new chain after the time has passed", () => {
    expect(continuesChain(at(4), at(0), 3)).toBe(false);
  });

  it("measures from the previous message, not the first in the chain", () => {
    // 0 -> 2 -> 4: each is within 3 minutes of the one before
    expect(continuesChain(at(2), at(0), 3)).toBe(true);
    expect(continuesChain(at(4), at(2), 3)).toBe(true);
  });

  it("doesn't chain different people, deleted users or the first message", () => {
    expect(continuesChain(at(1, "u2"), at(0), 3)).toBe(false);
    expect(continuesChain(at(1, null), at(0, null), 3)).toBe(false);
    expect(continuesChain(at(1), undefined, 3)).toBe(false);
  });

  it("is off at 0 minutes", () => {
    expect(continuesChain(at(0), at(0), 0)).toBe(false);
  });
});
