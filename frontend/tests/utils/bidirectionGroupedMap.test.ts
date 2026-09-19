import { beforeEach, describe, expect, it } from "vitest";
import { BidirectionalGroupedMap } from "../../src/utils/bidirectionGroupedMap";

describe("BidirectionalGroupedMap", () => {
  let map: BidirectionalGroupedMap<string, string>;

  beforeEach(() => {
    map = new BidirectionalGroupedMap();
  });

  it("stores and retrieves by key and by value", () => {
    map.set("a", "room1");
    map.set("b", "room1");

    expect(map.getByKey("a")).toBe("room1");
    expect(map.getByValueAsArray("room1")).toEqual(["a", "b"]);
    expect(map.hasKey("a")).toBe(true);
    expect(map.hasValue("room1")).toBe(true);
  });

  it("moves a key to its new value when re-set", () => {
    map.set("a", "room1");
    map.set("b", "room1");
    map.set("a", "room2");

    expect(map.getByKey("a")).toBe("room2");
    expect(map.getByValueAsArray("room1")).toEqual(["b"]);
    expect(map.getByValueAsArray("room2")).toEqual(["a"]);
  });

  it("removes a value entry once its last key is deleted", () => {
    map.set("a", "room1");
    map.deleteByKey("a");

    expect(map.hasKey("a")).toBe(false);
    expect(map.hasValue("room1")).toBe(false);
    expect(map.getByValueAsArray("room1")).toBeUndefined();
  });

  it("keeps a value entry while other keys still reference it", () => {
    map.set("a", "room1");
    map.set("b", "room1");
    map.deleteByKey("a");

    expect(map.hasValue("room1")).toBe(true);
    expect(map.getByValueAsArray("room1")).toEqual(["b"]);
  });

  it("ignores deleting an unknown key", () => {
    expect(() => map.deleteByKey("missing")).not.toThrow();
  });

  it("iterates over key/value pairs", () => {
    map.set("a", "room1");
    map.set("b", "room2");
    const seen: [string, string][] = [];
    map.forEach((value, key) => seen.push([key, value]));

    expect(seen).toEqual([
      ["a", "room1"],
      ["b", "room2"],
    ]);
  });
});
