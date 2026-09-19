import { describe, expect, it } from "vitest";
import { JOIN_KEY_LENGTH, generateJoinKey } from "../../src/lib/joinKey.js";
import { joinKeySchema } from "../../src/validators/chatrooms/chatroomValidation.js";

describe("generateJoinKey", () => {
  it("produces a URL-safe key of the expected length", () => {
    const key = generateJoinKey();
    expect(key).toHaveLength(JOIN_KEY_LENGTH);
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces keys that pass the join key validator", () => {
    for (let i = 0; i < 50; i++) {
      expect(
        joinKeySchema.safeParse({ joinKey: generateJoinKey() }).success,
      ).toBe(true);
    }
  });

  it("does not repeat", () => {
    const keys = new Set(Array.from({ length: 1000 }, generateJoinKey));
    expect(keys.size).toBe(1000);
  });
});
