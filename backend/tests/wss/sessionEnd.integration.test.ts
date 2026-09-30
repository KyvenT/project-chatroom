import http from "http";
import jwt from "jsonwebtoken";
import type { AddressInfo } from "net";
import WebSocket from "ws";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../../src/env.js", () => ({
  default: { JWT_SECRET: "test-secret", JWT_EXPIRATION: "1m" },
}));
vi.mock("../../src/prisma.js", () => ({
  default: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import Prisma from "../../src/prisma.js";
import { startWSS } from "../../src/wss/wss.js";
import { logoutUser, useRefreshToken } from "../../src/services/authService.js";
import { SESSION_ENDED } from "../../src/lib/socketSessions.js";

const db = Prisma as any;
let server: http.Server;
let url: string;

beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  server = http.createServer();
  startWSS(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `ws://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

// a real client signed in with a token for session `sid`
const connect = async (sid: string) => {
  const ws = new WebSocket(url);
  await new Promise((resolve) => ws.once("open", resolve));
  const reply = new Promise<any>((resolve) =>
    ws.once("message", (data) => resolve(JSON.parse(data.toString()))),
  );
  ws.send(
    JSON.stringify({
      type: "auth",
      token: jwt.sign({ userId: "u1", sid }, "test-secret"),
    }),
  );
  expect(await reply).toEqual({ type: "auth", success: true });
  return ws;
};
const closed = (ws: WebSocket) =>
  new Promise<number>((resolve) => ws.once("close", (code) => resolve(code)));

describe("ending a session over a real connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.session.findUnique.mockResolvedValue({
      id: "s1",
      userId: "u1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { username: "alice", isGuest: false },
    });
  });

  it("closes the socket with SESSION_ENDED when its session logs out", async () => {
    const ws = await connect("s1");
    const other = await connect("s2");
    const code = closed(ws);

    db.session.update.mockResolvedValue({ id: "s1" });
    await logoutUser("refresh-token");

    expect(await code).toBe(SESSION_ENDED);
    expect(other.readyState).toBe(WebSocket.OPEN);
    other.close();
  });

  it("keeps the socket through a token refresh, and ends it with the new session", async () => {
    const ws = await connect("s1");
    db.session.updateMany.mockResolvedValue({ count: 1 });
    db.session.create.mockResolvedValue({ id: "s1-renewed" });
    db.$transaction.mockImplementation(async (fn: any) => fn(db));

    await useRefreshToken("refresh-token");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(ws.readyState).toBe(WebSocket.OPEN);

    const code = closed(ws);
    db.session.update.mockResolvedValue({ id: "s1-renewed" });
    await logoutUser("new-refresh-token");
    expect(await code).toBe(SESSION_ENDED);
  });
});
