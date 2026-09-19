import { describe, expect, it } from "vitest";
import { parseJoinKey } from "../../src/utils/parseJoinKey";

const key = "abcDEF123_-xyz09";

describe("parseJoinKey", () => {
  it("accepts a bare key", () => {
    expect(parseJoinKey(key)).toBe(key);
  });

  it("trims surrounding whitespace", () => {
    expect(parseJoinKey(`  ${key}\n`)).toBe(key);
  });

  it("extracts the key from a full invite link", () => {
    expect(parseJoinKey(`https://chat.example.com/join/${key}`)).toBe(key);
    expect(parseJoinKey(`http://localhost:5173/join/${key}?ref=1#x`)).toBe(key);
    expect(parseJoinKey(`/join/${key}/`)).toBe(key);
  });

  it("rejects keys of the wrong length or with unsafe characters", () => {
    expect(parseJoinKey("short")).toBeNull();
    expect(parseJoinKey(key + "x")).toBeNull();
    expect(parseJoinKey("abcDEF123 -xyz09")).toBeNull();
    expect(parseJoinKey("abcDEF123/+xyz09")).toBeNull();
  });

  it("rejects empty input and links without a valid key", () => {
    expect(parseJoinKey("")).toBeNull();
    expect(parseJoinKey("https://chat.example.com/join/")).toBeNull();
    expect(parseJoinKey("https://chat.example.com/chat/abc")).toBeNull();
  });
});
