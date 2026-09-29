import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    chatroomMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    message: { create: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("../../src/wss/outgoing-messages/chat-message.js", () => ({
  sendChatMessage: vi.fn(),
}));
vi.mock("../../src/wss/outgoing-messages/typing-presence.js", () => ({
  sendTypingPresence: vi.fn(),
}));

import type WebSocket from "ws";
import Prisma from "../../src/prisma.js";
import { socketMap, userActiveChatroomMap } from "../../src/lib/socketMaps.js";
import { handleChatMessage } from "../../src/wss/incoming-message-routes/chat-message.js";
import { updateActiveChatroom } from "../../src/wss/incoming-message-routes/active-chatroom.js";
import { handleTypingPresence } from "../../src/wss/incoming-message-routes/typing-presence.js";
import { handleUpdateLastViewedAt } from "../../src/wss/incoming-message-routes/update-last-viewed-at.js";
import { wsMessageRouter } from "../../src/wss/router.js";
import { sendChatMessage } from "../../src/wss/outgoing-messages/chat-message.js";
import { sendTypingPresence } from "../../src/wss/outgoing-messages/typing-presence.js";

const db = Prisma as any;
let ws: WebSocket & { send: ReturnType<typeof vi.fn> };

const member = () =>
  db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
const notMember = () => db.chatroomMember.findUnique.mockResolvedValue(null);

beforeEach(() => {
  vi.clearAllMocks();
  ws = { send: vi.fn() } as any;
  socketMap.set("u1", ws);
  userActiveChatroomMap.deleteByKey("u1");
});

describe("sending a chat message", () => {
  const message = { type: "message", content: "hi", chatroomId: "c1" } as const;

  it("is refused for chatrooms the sender isn't in", async () => {
    notMember();
    await handleChatMessage(message, ws);

    expect(db.message.create).not.toHaveBeenCalled();
    expect(sendChatMessage).not.toHaveBeenCalled();
    expect(JSON.parse(ws.send.mock.calls[0][0]).message).toMatch(
      /not a member/,
    );
  });

  it("is saved and sent for members", async () => {
    member();
    db.message.create.mockResolvedValue({ id: "m1", chatroomId: "c1" });
    await handleChatMessage(message, ws);

    expect(db.message.create).toHaveBeenCalled();
    expect(sendChatMessage).toHaveBeenCalledWith({
      id: "m1",
      chatroomId: "c1",
    });
  });
});

describe("setting the active chatroom", () => {
  it("is refused for chatrooms the user isn't in", async () => {
    userActiveChatroomMap.set("u1", "c-old");
    notMember();
    await updateActiveChatroom(
      { type: "update-active-chatroom", chatroomId: "c-secret" },
      ws,
    );

    // no longer receiving the old chatroom's messages, nor the new one's
    expect(userActiveChatroomMap.getByKey("u1")).toBeUndefined();
    expect(userActiveChatroomMap.getByValue("c-secret")).toBeUndefined();
  });

  it("works for members and for the home page", async () => {
    member();
    await updateActiveChatroom(
      { type: "update-active-chatroom", chatroomId: "c1" },
      ws,
    );
    expect(userActiveChatroomMap.getByKey("u1")).toBe("c1");

    notMember();
    await updateActiveChatroom(
      { type: "update-active-chatroom", chatroomId: "home" },
      ws,
    );
    expect(userActiveChatroomMap.getByKey("u1")).toBe("home");
  });
});

describe("typing presence", () => {
  it("is only sent for members", async () => {
    notMember();
    await handleTypingPresence(
      { type: "typing-presence", chatroomId: "c1" },
      ws,
    );
    expect(sendTypingPresence).not.toHaveBeenCalled();

    member();
    await handleTypingPresence(
      { type: "typing-presence", chatroomId: "c1" },
      ws,
    );
    expect(sendTypingPresence).toHaveBeenCalledWith("c1", "u1");
  });
});

describe("marking a chatroom read", () => {
  const read = { type: "update-last-viewed-at", chatroomId: "c1" } as const;

  it("does nothing for chatrooms the user isn't in", async () => {
    notMember();
    await handleUpdateLastViewedAt(read, ws);
    expect(db.chatroomMember.update).not.toHaveBeenCalled();
  });

  it("doesn't throw when the update fails", async () => {
    member();
    db.chatroomMember.update.mockRejectedValue(new Error("db down"));
    await expect(handleUpdateLastViewedAt(read, ws)).resolves.toBeUndefined();
  });
});

describe("wsMessageRouter", () => {
  it("catches errors from handlers instead of leaving them unhandled", async () => {
    db.chatroomMember.findUnique.mockRejectedValue(new Error("db down"));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    wsMessageRouter({ type: "typing-presence", chatroomId: "c1" }, ws);
    await vi.waitFor(() =>
      expect(errors).toHaveBeenCalledWith(
        "websocket handler error",
        expect.any(Error),
      ),
    );
    errors.mockRestore();
  });
});
