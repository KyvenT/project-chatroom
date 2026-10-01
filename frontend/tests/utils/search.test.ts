import { describe, expect, it } from "vitest";
import {
  matchesQuery,
  normalizeQuery,
  splitMatches,
} from "../../src/utils/search";

describe("search helpers", () => {
  it("matches case-insensitively, ignoring surrounding spaces", () => {
    const q = normalizeQuery("  StAnD ");
    expect(matchesQuery("Daily standup", q)).toBe(true);
    expect(matchesQuery("Design", q)).toBe(false);
    expect(matchesQuery("anything", normalizeQuery(""))).toBe(true);
  });

  it("splits text into matching and other parts", () => {
    expect(splitMatches("Book club books", "book")).toEqual([
      { text: "Book", match: true },
      { text: " club ", match: false },
      { text: "book", match: true },
      { text: "s", match: false },
    ]);
    expect(splitMatches("Design", "")).toEqual([
      { text: "Design", match: false },
    ]);
  });
});
