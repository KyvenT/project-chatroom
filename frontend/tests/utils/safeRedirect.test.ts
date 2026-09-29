import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "../../src/utils/safeRedirect";

describe("getSafeRedirect", () => {
  it("follows same-origin paths", () => {
    expect(getSafeRedirect("/join/abcDEF123_-xyz09")).toBe(
      "/join/abcDEF123_-xyz09",
    );
  });

  it("falls back when there is no next path", () => {
    expect(getSafeRedirect(null)).toBe("/chat");
    expect(getSafeRedirect("")).toBe("/chat");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "join/x"])(
    "rejects %s",
    (next) => {
      expect(getSafeRedirect(next)).toBe("/chat");
    },
  );
});
