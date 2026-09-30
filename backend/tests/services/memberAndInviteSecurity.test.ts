import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/wss/outgoing-messages/update-chatrooms.js", () => ({
  sendUpdateChatrooms: vi.fn(),
}));
vi.mock("../../src/wss/outgoing-messages/notification.js", () => ({
  handleNewNotification: vi.fn(),
}));
vi.mock("../../src/wss/outgoing-messages/update-invites.js", () => ({
  sendUpdateInvites: vi.fn(),
}));
vi.mock("../../src/prisma.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    chatroom: { findUnique: vi.fn() },
    chatroomMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn((args) => args),
    },
    memberPinnedGroups: { deleteMany: vi.fn((args) => args) },
    invite: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import Prisma from "../../src/prisma.js";
import {
  userActiveChatroomMap,
  userWatchedChatroomsMap,
} from "../../src/lib/socketMaps.js";
import {
  getMemberDetails,
  removeMemberFromChatroom,
} from "../../src/services/memberService.js";
import {
  createInvite,
  respondToInvite,
} from "../../src/services/inviteService.js";
import { sendUpdateChatrooms } from "../../src/wss/outgoing-messages/update-chatrooms.js";
import { updateInviteStatusSchema } from "../../src/validators/invites/inviteValidation.js";

const db = Prisma as any;
const uuid = "3f2b8c1e-5d4a-4f6b-8a9c-1b2c3d4e5f60";

beforeEach(() => {
  vi.clearAllMocks();
  userActiveChatroomMap.deleteByKey("member");
  userWatchedChatroomsMap.deleteUser("member");
});

describe("removeMemberFromChatroom", () => {
  const remove = (userId: string, memberId: string) =>
    removeMemberFromChatroom(userId, { chatroomId: "c1", memberId });

  beforeEach(() => {
    db.chatroom.findUnique.mockResolvedValue({ ownerId: "owner" });
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "member" });
  });

  it("doesn't let anyone remove the owner", async () => {
    await expect(remove("stranger", "owner")).rejects.toThrow(
      "The owner can't leave or be removed from their chatroom",
    );
    await expect(remove("owner", "owner")).rejects.toThrow(
      "The owner can't leave or be removed from their chatroom",
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("doesn't let members remove each other", async () => {
    await expect(remove("other-member", "member")).rejects.toThrow(
      "Only the owner can remove other members",
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("lets members leave and the owner remove them", async () => {
    await remove("member", "member");
    await remove("owner", "member");
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(sendUpdateChatrooms).toHaveBeenCalledWith("c1", "member", "LEAVE");
  });

  it("stops sending a removed member the chatroom's messages", async () => {
    userActiveChatroomMap.set("member", "c1");
    userWatchedChatroomsMap.set("member", ["c1", "c2"]);

    await remove("owner", "member");

    expect(userActiveChatroomMap.getByKey("member")).toBeUndefined();
    expect([...userWatchedChatroomsMap.getWatched("member")]).toEqual(["c2"]);
  });

  it("unpins the chatroom from the member's pinned groups", async () => {
    await remove("member", "member");
    const [, unpin] = db.$transaction.mock.calls[0][0];
    expect(unpin.where).toEqual({
      chatroomId: "c1",
      pinGroup: { userId: "member" },
    });
  });
});

describe("getMemberDetails", () => {
  it("only returns what other members may see, not e.g. email", async () => {
    db.chatroomMember.findUnique
      .mockResolvedValueOnce({ memberId: "u1" })
      .mockResolvedValueOnce({ joinedAt: new Date(), member: {} });

    await getMemberDetails("u1", { chatroomId: "c1", memberId: "u2" });

    const { select } = db.chatroomMember.findUnique.mock.calls[1][0];
    expect(Object.keys(select.member.select).sort()).toEqual([
      "createdAt",
      "id",
      "isGuest",
      "status",
      "username",
    ]);
  });
});

describe("createInvite", () => {
  const invite = (senderId = "sender") =>
    createInvite(senderId, { chatroomId: "c1", receiverUsername: "bob" });

  const setup = ({
    privacy = "PUBLIC",
    senderIsMember = true,
    receiverIsGuest = false,
  } = {}) => {
    db.chatroom.findUnique.mockResolvedValue({ privacy, ownerId: "owner" });
    db.user.findUnique.mockResolvedValue({
      id: "bob",
      isGuest: receiverIsGuest,
    });
    db.chatroomMember.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve(
        where.chatroomId_memberId.memberId === "bob"
          ? null
          : senderIsMember
            ? { member: { isGuest: false } }
            : null,
      ),
    );
    db.invite.findMany.mockResolvedValue([]);
    db.invite.create.mockResolvedValue({ id: "i1" });
  };

  it("refuses senders who aren't in the chatroom, even public ones", async () => {
    setup({ senderIsMember: false });
    await expect(invite()).rejects.toThrow(
      "User does not have permission to invite to this chatroom",
    );
    expect(db.invite.create).not.toHaveBeenCalled();
  });

  it("lets members invite to joinable chatrooms", async () => {
    setup({ privacy: "JOINABLE" });
    await invite();
    expect(db.invite.create).toHaveBeenCalled();
  });

  it("only lets the owner invite to invite-only chatrooms", async () => {
    setup({ privacy: "INVITE_ONLY" });
    await expect(invite("sender")).rejects.toThrow("permission");
    await invite("owner");
    expect(db.invite.create).toHaveBeenCalledOnce();
  });

  it("only lets guests be invited to public chatrooms", async () => {
    setup({ privacy: "JOINABLE", receiverIsGuest: true });
    await expect(invite()).rejects.toThrow("permission");

    setup({ privacy: "PUBLIC", receiverIsGuest: true });
    await invite();
    expect(db.invite.create).toHaveBeenCalledOnce();
  });
});

describe("respondToInvite", () => {
  beforeEach(() => {
    db.invite.findUnique.mockResolvedValue({
      id: "i1",
      receiverId: "u1",
      chatroomId: "c1",
    });
    db.chatroomMember.findUnique.mockResolvedValue(null);
    db.chatroomMember.findFirst.mockResolvedValue(null);
  });

  it("only answers pending invites, once", async () => {
    db.invite.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      respondToInvite("u1", { inviteId: "i1", status: "ACCEPTED" }),
    ).rejects.toThrow("Invite has already been answered");

    expect(db.invite.updateMany.mock.calls[0][0].where).toEqual({
      id: "i1",
      status: "PENDING",
    });
    expect(db.chatroomMember.create).not.toHaveBeenCalled();
  });

  it("joins the chatroom when accepted", async () => {
    db.invite.updateMany.mockResolvedValue({ count: 1 });
    await respondToInvite("u1", { inviteId: "i1", status: "ACCEPTED" });
    expect(db.chatroomMember.create.mock.calls[0][0].data).toMatchObject({
      memberId: "u1",
      chatroomId: "c1",
    });
  });

  it("refuses someone else's invite", async () => {
    await expect(
      respondToInvite("u2", { inviteId: "i1", status: "ACCEPTED" }),
    ).rejects.toThrow("Not detected as receiver of this invite");
  });

  it("can't be set back to pending", () => {
    expect(
      updateInviteStatusSchema.safeParse({ inviteId: uuid, status: "PENDING" })
        .success,
    ).toBe(false);
  });
});
