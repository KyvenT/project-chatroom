import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/refreshAccessToken", () => ({
  refreshAccessToken: vi.fn(),
}));
vi.mock("../../src/env", () => ({ WS_URL: "ws://test", API_URL: "" }));

import { refreshAccessToken } from "../../src/utils/refreshAccessToken";
import { useAuthStore } from "../../src/hooks/useStores";
import { useConnectionStore } from "../../src/hooks/useConnectionStore";
import {
  SESSION_ENDED,
  closeWs,
  sendWSMessage,
  startWSConnection,
} from "../../src/ws-router/ws";

// a stand-in WebSocket the tests drive by hand
class FakeSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeSocket[] = [];
  readyState = FakeSocket.CONNECTING;
  sent: unknown[] = [];
  onopen?: () => void;
  onmessage?: (e: { data: string }) => void;
  onclose?: (e: { code: number }) => void;
  onerror?: () => void;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.serverClose(1000);
  }
  // test helpers
  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
  receive(message: object) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
  serverClose(code: number) {
    if (this.readyState === FakeSocket.CLOSED) return;
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.({ code });
  }
}

const latest = () => FakeSocket.instances[FakeSocket.instances.length - 1];
const signIn = (token = "t1") =>
  useAuthStore.getState().handleSignIn({
    userId: "u1",
    username: "alice",
    token,
    isGuest: false,
  });
const refreshed = (token: string) =>
  ({
    ok: true,
    userId: "u1",
    username: "alice",
    token,
    isGuest: false,
  }) as const;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("websocket connection", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(refreshAccessToken).mockReset();
    signIn();
  });

  afterEach(() => {
    closeWs();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("signs in when it opens and sends what was queued once signed in", () => {
    startWSConnection();
    sendWSMessage({ type: "typing-presence", chatroomId: "c1" });
    const socket = latest();
    socket.open();
    expect(socket.sent).toEqual([{ type: "auth", token: "t1" }]);

    const before = useConnectionStore.getState().connectionId;
    socket.receive({ type: "auth", success: true });

    expect(socket.sent[1]).toEqual({
      type: "typing-presence",
      chatroomId: "c1",
    });
    expect(useConnectionStore.getState().connectionId).toBe(before + 1);
  });

  it("signs out when the server ends the session", async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue({
      ok: false,
      message: "Invalid refresh token",
      rejected: true,
    });
    startWSConnection();
    latest().open();

    latest().serverClose(SESSION_ENDED);
    await flush();

    expect(useAuthStore.getState().user.token).toBe("");
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("reconnects after the session ends if a refresh still works", async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(refreshed("t2"));
    startWSConnection();
    latest().open();

    latest().serverClose(SESSION_ENDED);
    await flush();

    expect(FakeSocket.instances).toHaveLength(2);
    latest().open();
    expect(latest().sent).toEqual([{ type: "auth", token: "t2" }]);
  });

  it("reconnects with growing delays when the connection drops", () => {
    vi.useFakeTimers();
    startWSConnection();
    latest().open();

    latest().serverClose(1006);
    vi.advanceTimersByTime(999);
    expect(FakeSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(2);

    latest().serverClose(1006);
    vi.advanceTimersByTime(1999);
    expect(FakeSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(3);
  });

  it("refreshes an expired token and signs in again, but only once", async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(refreshed("t2"));
    startWSConnection();
    const socket = latest();
    socket.open();

    socket.receive({ type: "auth", success: false, error: "Expired token" });
    await flush();
    expect(socket.sent[1]).toEqual({ type: "auth", token: "t2" });

    // failing again closes the socket instead of refreshing forever
    socket.receive({ type: "auth", success: false, error: "Expired token" });
    await flush();
    expect(refreshAccessToken).toHaveBeenCalledOnce();
    expect(socket.readyState).toBe(FakeSocket.CLOSED);
  });

  it("keeps trying when the server can't be reached", async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue({
      ok: false,
      message: "Failed to fetch",
      rejected: false,
    });
    startWSConnection();
    latest().open();
    latest().serverClose(SESSION_ENDED);
    await flush();

    // still signed in, and a reconnect is on its way
    expect(useAuthStore.getState().user.token).toBe("t1");
  });

  it("doesn't reconnect or send leftovers after signing out", () => {
    vi.useFakeTimers();
    startWSConnection();
    latest().open();
    sendWSMessage({ type: "typing-presence", chatroomId: "c1" });

    closeWs();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(1);

    startWSConnection();
    latest().open();
    latest().receive({ type: "auth", success: true });
    expect(latest().sent).toEqual([{ type: "auth", token: "t1" }]);
  });
});
