import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/env.js", () => ({ default: { JWT_SECRET: "test-secret" } }));
vi.mock("../../src/prisma.js", () => ({
  default: { session: { findUnique: vi.fn() } },
}));

import type WebSocket from "ws";
import Prisma from "../../src/prisma.js";
import { socketMap } from "../../src/lib/socketMaps.js";
import { socketSessions } from "../../src/lib/socketSessions.js";
import { authenticateSocket } from "../../src/wss/incoming-message-routes/auth.js";

const db = Prisma as any;
const token = (claims: object) => jwt.sign(claims, "test-secret");

describe("socket sign-in", () => {
  let ws: WebSocket & { send: ReturnType<typeof vi.fn> };
  const reply = () => JSON.parse(ws.send.mock.calls[0][0]);

  beforeEach(() => {
    vi.clearAllMocks();
    ws = { send: vi.fn(), close: vi.fn() } as any;
  });

  it("signs in with a token for an active session", async () => {
    db.session.findUnique.mockResolvedValue({
      userId: "u1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authenticateSocket(
      { type: "auth", token: token({ userId: "u1", sid: "s1" }) },
      ws,
    );

    expect(reply()).toEqual({ type: "auth", success: true });
    expect(socketMap.getByKey("u1")).toBe(ws);
    expect(socketSessions.sessionOf(ws)).toBe("s1");
    socketSessions.remove(ws);
  });

  it.each([
    [
      "revoked",
      {
        userId: "u1",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    ],
    [
      "expired",
      { userId: "u1", revokedAt: null, expiresAt: new Date(Date.now() - 1000) },
    ],
    [
      "someone else's",
      {
        userId: "u2",
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      },
    ],
    ["missing", null],
  ])("refuses a token whose session is %s", async (_label, session) => {
    db.session.findUnique.mockResolvedValue(session);
    await authenticateSocket(
      { type: "auth", token: token({ userId: "u1", sid: "s1" }) },
      ws,
    );
    expect(reply()).toEqual({
      type: "auth",
      success: false,
      error: "Session ended",
    });
    expect(socketSessions.sessionOf(ws)).toBeUndefined();
  });

  it("refuses tokens without a session", async () => {
    await authenticateSocket(
      { type: "auth", token: token({ userId: "u1" }) },
      ws,
    );
    expect(reply()).toMatchObject({ success: false, error: "Invalid token" });
    expect(db.session.findUnique).not.toHaveBeenCalled();
  });
});
