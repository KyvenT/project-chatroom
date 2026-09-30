import type WebSocket from "ws";
import { describe, expect, it, vi } from "vitest";
import { SESSION_ENDED, socketSessions } from "../../src/lib/socketSessions.js";

const socket = () =>
  ({ close: vi.fn() }) as unknown as WebSocket & {
    close: ReturnType<typeof vi.fn>;
  };

describe("socketSessions", () => {
  it("closes a session's sockets when it ends, and only those", () => {
    const a1 = socket();
    const a2 = socket();
    const b = socket();
    socketSessions.add(a1, "sa");
    socketSessions.add(a2, "sa");
    socketSessions.add(b, "sb");

    socketSessions.endSessions(["sa"]);

    expect(a1.close).toHaveBeenCalledWith(SESSION_ENDED, "Session ended");
    expect(a2.close).toHaveBeenCalledWith(SESSION_ENDED, "Session ended");
    expect(b.close).not.toHaveBeenCalled();
    expect(socketSessions.sessionOf(a1)).toBeUndefined();
    socketSessions.remove(b);
  });

  it("keeps sockets through a refresh, under the new session", () => {
    const ws = socket();
    socketSessions.add(ws, "old");
    socketSessions.rename("old", "new");

    socketSessions.endSessions(["old"]);
    expect(ws.close).not.toHaveBeenCalled();

    socketSessions.endSessions(["new"]);
    expect(ws.close).toHaveBeenCalledOnce();
  });

  it("forgets closed sockets", () => {
    const ws = socket();
    socketSessions.add(ws, "s");
    socketSessions.remove(ws);
    socketSessions.endSessions(["s"]);
    expect(ws.close).not.toHaveBeenCalled();
  });
});
