import { describe, expect, it } from "vitest";
import { moveId, sameOrder, shiftId } from "../../src/utils/reorder";

describe("moveId", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves an id before or after another", () => {
    expect(moveId(ids, "a", "c", true)).toEqual(["b", "c", "a", "d"]);
    expect(moveId(ids, "a", "c", false)).toEqual(["b", "a", "c", "d"]);
    expect(moveId(ids, "d", "a", false)).toEqual(["d", "a", "b", "c"]);
  });

  it("leaves the order alone for a drop on itself or unknown ids", () => {
    expect(moveId(ids, "b", "b", true)).toBe(ids);
    expect(moveId(ids, "x", "b", true)).toBe(ids);
  });
});

describe("shiftId", () => {
  it("moves an id one place, not past either end", () => {
    expect(shiftId(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(shiftId(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
    expect(shiftId(["a", "b"], "a", -1)).toEqual(["a", "b"]);
    expect(shiftId(["a", "b"], "b", 1)).toEqual(["a", "b"]);
  });
});

describe("sameOrder", () => {
  it("compares orders", () => {
    expect(sameOrder(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameOrder(["a", "b"], ["b", "a"])).toBe(false);
  });
});
