import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    chatroomMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    message: { count: vi.fn() },
  },
}));
vi.mock("../../src/wss/outgoing-messages/update-unread-count.js", () => ({
  sendUpdateUnreadMessage: vi.fn(),
}));

import type WebSocket from "ws";
import Prisma from "../../src/prisma.js";
import {
  socketMap,
  userActiveChatroomMap,
  userWatchedChatroomsMap,
} from "../../src/lib/socketMaps.js";
import { updateWatchedChatrooms } from "../../src/wss/incoming-message-routes/update-watched-chatrooms.js";
import { sendChatMessage } from "../../src/wss/outgoing-messages/chat-message.js";
import { sendUpdateUnreadMessage } from "../../src/wss/outgoing-messages/update-unread-count.js";
import { WSMessageSchema } from "../../src/validators/ws/wsValidation.js";

const db = Prisma as any;
const socket = () =>
  ({ send: vi.fn() }) as unknown as WebSocket & {
    send: ReturnType<typeof vi.fn>;
  };

beforeEach(() => {
  vi.clearAllMocks();
  userWatchedChatroomsMap.deleteUser("u1");
  userWatchedChatroomsMap.deleteUser("u2");
  userActiveChatroomMap.deleteByKey("u1");
  userActiveChatroomMap.deleteByKey("u2");
});

describe("update-watched-chatrooms messages", () => {
  it("validates the chatroom list", () => {
    const ok = (m: unknown) => WSMessageSchema.safeParse(m).success;
    expect(
      ok({ type: "update-watched-chatrooms", chatroomIds: ["c1", "c2"] }),
    ).toBe(true);
    expect(ok({ type: "update-watched-chatrooms", chatroomIds: [] })).toBe(
      true,
    );
    expect(
      ok({
        type: "update-watched-chatrooms",
        chatroomIds: Array.from({ length: 11 }, (_, i) => `c${i}`),
      }),
    ).toBe(false);
  });

  it("only watches chatrooms the user is a member of", async () => {
    const ws = socket();
    socketMap.set("u1", ws);
    db.chatroomMember.findMany.mockResolvedValue([{ chatroomId: "c1" }]);

    await updateWatchedChatrooms(
      { type: "update-watched-chatrooms", chatroomIds: ["c1", "not-mine"] },
      ws,
    );

    expect([...userWatchedChatroomsMap.getWatched("u1")]).toEqual(["c1"]);
    expect(db.chatroomMember.findMany.mock.calls[0][0].where).toEqual({
      memberId: "u1",
      chatroomId: { in: ["c1", "not-mine"] },
    });
  });
});

describe("sendChatMessage", () => {
  const message = { id: "m1", chatroomId: "c1", content: "hi" } as any;

  it("sends new messages live to users watching the chatroom", async () => {
    const watcher = socket();
    const other = socket();
    socketMap.set("u1", watcher);
    socketMap.set("u2", other);
    userWatchedChatroomsMap.set("u1", ["c1"]);
    db.chatroomMember.findMany.mockResolvedValue([
      { memberId: "u1" },
      { memberId: "u2" },
    ]);
    db.chatroomMember.findUnique.mockResolvedValue({
      lastViewedAt: new Date(),
    });
    db.message.count.mockResolvedValue(1);

    await sendChatMessage(message);
    await vi.waitFor(() => expect(sendUpdateUnreadMessage).toHaveBeenCalled());

    expect(JSON.parse(watcher.send.mock.calls[0][0])).toEqual({
      type: "chat-message",
      message,
    });
    expect(other.send).not.toHaveBeenCalled();
    // only the member who isn't watching gets an unread count
    expect(vi.mocked(sendUpdateUnreadMessage).mock.calls).toEqual([
      ["c1", "u2", 1],
    ]);
  });
});
