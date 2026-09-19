import { describe, expect, it } from "vitest";
import {
  guestSchema,
  refreshTokenSchema,
  userSchema,
} from "../../src/validators/auth/authValidation.js";
import {
  chatroomIdSchema,
  joinKeySchema,
  chatroomModifyIndexSchema,
  chatroomSetOptionsSchema,
} from "../../src/validators/chatrooms/chatroomValidation.js";
import {
  inviteIdSchema,
  sendInviteSchema,
  updateInviteStatusSchema,
} from "../../src/validators/invites/inviteValidation.js";
import { retrieveMessageSchema } from "../../src/validators/messages/messageValidation.js";
import { chatroomMemberSchema } from "../../src/validators/members/memberValidation.js";
import { updateUserStatusSchema } from "../../src/validators/users/userValidation.js";
import {
  PinnedGroupNameSchema,
  chatroomPinSchema,
} from "../../src/validators/pinned-groups/pinnedGroupsValidation.js";
import {
  ChatMessageSchema,
  WSMessageSchema,
} from "../../src/validators/ws/wsValidation.js";

const uuid = "3f2b8c1e-5d4a-4f6b-8a9c-1b2c3d4e5f60";
const ok = (
  schema: { safeParse: (d: unknown) => { success: boolean } },
  d: unknown,
) => expect(schema.safeParse(d).success).toBe(true);
const bad = (
  schema: { safeParse: (d: unknown) => { success: boolean } },
  d: unknown,
) => expect(schema.safeParse(d).success).toBe(false);

describe("auth schemas", () => {
  it("enforces username and password length bounds", () => {
    ok(userSchema, { username: "abc", password: "123456" });
    bad(userSchema, { username: "ab", password: "123456" });
    bad(userSchema, { username: "a".repeat(21), password: "123456" });
    bad(userSchema, { username: "abc", password: "12345" });
    bad(userSchema, { username: "abc", password: "x".repeat(129) });
  });

  it("requires guest and refresh token fields", () => {
    ok(guestSchema, { joinKey: "k", username: "u" });
    bad(guestSchema, { username: "u" });
    ok(refreshTokenSchema, { refreshToken: "t" });
    bad(refreshTokenSchema, {});
  });
});

describe("chatroom schemas", () => {
  it("validates title length and privacy enum", () => {
    ok(chatroomSetOptionsSchema, { title: "Room", privacy: "PUBLIC" });
    bad(chatroomSetOptionsSchema, { title: "", privacy: "PUBLIC" });
    bad(chatroomSetOptionsSchema, { title: "x".repeat(31), privacy: "PUBLIC" });
    bad(chatroomSetOptionsSchema, { title: "Room", privacy: "SECRET" });
  });

  it("requires uuid chatroom ids and a positive integer index", () => {
    ok(chatroomIdSchema, { chatroomId: uuid });
    bad(chatroomIdSchema, { chatroomId: "not-a-uuid" });
    ok(chatroomModifyIndexSchema, { chatroomId: uuid, newIndex: 1 });
    bad(chatroomModifyIndexSchema, { chatroomId: uuid, newIndex: 0 });
    bad(chatroomModifyIndexSchema, { chatroomId: uuid, newIndex: 1.5 });
  });
});

describe("joinKeySchema", () => {
  it("accepts 16 url-safe characters", () => {
    ok(joinKeySchema, { joinKey: "abcDEF123_-xyz09" });
  });

  it("rejects wrong lengths and unsafe characters", () => {
    bad(joinKeySchema, { joinKey: "short" });
    bad(joinKeySchema, { joinKey: "a".repeat(17) });
    bad(joinKeySchema, { joinKey: "abcDEF123 -xyz09" });
    bad(joinKeySchema, { joinKey: "abcDEF123/+xyz09" });
    bad(joinKeySchema, {});
  });

  it("does not accept a chatroom uuid as a join key", () => {
    bad(joinKeySchema, { joinKey: uuid });
  });
});

describe("invite schemas", () => {
  it("validates sending and updating invites", () => {
    ok(sendInviteSchema, { chatroomId: uuid, receiverUsername: "bob" });
    bad(sendInviteSchema, { chatroomId: uuid, receiverUsername: "bo" });
    ok(inviteIdSchema, { inviteId: uuid });
    bad(inviteIdSchema, { inviteId: "x" });
    bad(updateInviteStatusSchema, { inviteId: uuid, status: "MAYBE" });
  });
});

describe("message and member schemas", () => {
  it("requires an ISO date and coerces limit, capped at 25", () => {
    const base = { chatroomId: uuid, getBefore: "2025-01-01T00:00:00Z" };
    const parsed = retrieveMessageSchema.parse({ ...base, limit: "10" });
    expect(parsed.limit).toBe(10);
    bad(retrieveMessageSchema, { ...base, limit: "26" });
    bad(retrieveMessageSchema, { ...base, getBefore: "yesterday", limit: 5 });
  });

  it("requires uuid member ids", () => {
    ok(chatroomMemberSchema, { chatroomId: uuid, memberId: uuid });
    bad(chatroomMemberSchema, { chatroomId: uuid, memberId: "x" });
  });

  it("only accepts known statuses", () => {
    ok(updateUserStatusSchema, { status: "ONLINE" });
    bad(updateUserStatusSchema, { status: "BUSY" });
  });
});

describe("pinned group schemas", () => {
  it("validates names and pin payloads", () => {
    ok(PinnedGroupNameSchema, { name: "Work" });
    bad(PinnedGroupNameSchema, { name: "" });
    ok(chatroomPinSchema, { chatroomId: uuid, pinGroupId: uuid, pin: true });
    bad(chatroomPinSchema, { chatroomId: uuid, pinGroupId: uuid, pin: "yes" });
  });
});

describe("websocket schemas", () => {
  it("limits chat message content to 1-60 characters", () => {
    ok(ChatMessageSchema, { type: "message", content: "hi", chatroomId: "c" });
    bad(ChatMessageSchema, { type: "message", content: "", chatroomId: "c" });
    bad(ChatMessageSchema, {
      type: "message",
      content: "x".repeat(61),
      chatroomId: "c",
    });
  });

  it("discriminates on message type", () => {
    ok(WSMessageSchema, { type: "auth", token: "t" });
    ok(WSMessageSchema, { type: "typing-presence", chatroomId: "c" });
    bad(WSMessageSchema, { type: "unknown" });
    bad(WSMessageSchema, { type: "auth" });
  });
});
