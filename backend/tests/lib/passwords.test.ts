import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/passwords.js";

describe("passwords", () => {
  it("checks new hashes", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", hash)).toEqual({
      ok: true,
      needsRehash: false,
    });
    expect((await verifyPassword("wrong horse", hash)).ok).toBe(false);
  });

  it("uses every character of a long password", async () => {
    // plain bcrypt only reads the first 72 bytes, so these would match
    const base = "x".repeat(100);
    const hash = await hashPassword(base + "a");
    expect((await verifyPassword(base + "a", hash)).ok).toBe(true);
    expect((await verifyPassword(base + "b", hash)).ok).toBe(false);
  });

  it("handles multi-byte characters", async () => {
    const password = "🔒".repeat(40); // 160 bytes
    const hash = await hashPassword(password);
    expect((await verifyPassword(password, hash)).ok).toBe(true);
    expect((await verifyPassword("🔒".repeat(39) + "🔑", hash)).ok).toBe(false);
  });

  it("still accepts old-style hashes, asking for them to be upgraded", async () => {
    const oldHash = await bcrypt.hash("legacy-pass", 4);
    expect(await verifyPassword("legacy-pass", oldHash)).toEqual({
      ok: true,
      needsRehash: true,
    });
    expect(await verifyPassword("nope", oldHash)).toEqual({
      ok: false,
      needsRehash: false,
    });
  });
});
