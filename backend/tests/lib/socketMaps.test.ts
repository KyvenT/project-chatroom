import type WebSocket from "ws";
import { beforeEach, describe, expect, it } from "vitest";
import {
  BidirectionalGroupedMap,
  BidirectionalMap,
} from "../../src/lib/socketMaps.js";

describe("BidirectionalMap", () => {
  let map: BidirectionalMap<string, WebSocket>;
  const ws1 = { id: 1 } as unknown as WebSocket;
  const ws2 = { id: 2 } as unknown as WebSocket;

  beforeEach(() => {
    map = new BidirectionalMap();
  });

  it("looks up in both directions", () => {
    map.set("u1", ws1);
    expect(map.getByKey("u1")).toBe(ws1);
    expect(map.getByValue(ws1)).toBe("u1");
    expect(map.hasKey("u1")).toBe(true);
    expect(map.hasValue(ws1)).toBe(true);
  });

  it("deletes by key and by value, clearing both sides", () => {
    map.set("u1", ws1);
    map.set("u2", ws2);

    map.deleteByKey("u1");
    expect(map.hasValue(ws1)).toBe(false);

    map.deleteByValue(ws2);
    expect(map.hasKey("u2")).toBe(false);
  });

  it("replaces the previous socket when a key is re-set", () => {
    map.set("u1", ws1);
    map.set("u1", ws2);

    expect(map.getByKey("u1")).toBe(ws2);
    expect(map.getByValue(ws2)).toBe("u1");
  });
});

describe("BidirectionalGroupedMap", () => {
  let map: BidirectionalGroupedMap<string, string>;

  beforeEach(() => {
    map = new BidirectionalGroupedMap();
  });

  it("groups keys by value and moves keys between groups", () => {
    map.set("u1", "room1");
    map.set("u2", "room1");
    expect(map.getByValueAsArray("room1")).toEqual(["u1", "u2"]);

    map.set("u1", "room2");
    expect(map.getByValueAsArray("room1")).toEqual(["u2"]);
    expect(map.getByKey("u1")).toBe("room2");
  });

  it("removes empty groups on delete", () => {
    map.set("u1", "room1");
    map.deleteByKey("u1");
    expect(map.hasValue("room1")).toBe(false);
    expect(map.getByValueAsArray("room1")).toBeUndefined();
  });
});
