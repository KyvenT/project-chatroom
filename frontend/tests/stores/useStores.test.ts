import { beforeEach, describe, expect, it } from "vitest";
import {
  isLoggedInSelector,
  useActiveChatroomStore,
  useAuthStore,
  useChatroomsStore,
  useInvitesStore,
  useMembersStore,
  useMessagesStore,
  useTypingPresenceStore,
} from "../../src/hooks/useStores";
import type { Chatroom } from "../../src/types/REST-types/Chatroom";
import type { ChatroomMember } from "../../src/types/REST-types/ChatroomMember";
import type { Message } from "../../src/types/REST-types/Message";

const makeChatroom = (id: string, index: number): Chatroom => ({
  chatroomId: id,
  lastViewedAt: new Date(0),
  unreadMessages: 0,
  chatroomIndex: index,
  chatroom: { title: `Room ${id}`, privacy: "INVITE_ONLY", ownerId: "u1" },
});

const makeMessage = (id: string): Message => ({
  id,
  createdAt: new Date(0),
  chatroomId: "c1",
  content: `msg ${id}`,
  senderUserId: "u1",
  senderUser: { id: "u1", username: "alice" },
  editedAt: null,
});

const makeMember = (
  id: string,
  status: "ONLINE" | "AWAY" | "OFFLINE" = "ONLINE",
): ChatroomMember => ({
  memberId: id,
  role: "MEMBER",
  member: { username: `user-${id}`, status },
});

describe("useChatroomsStore", () => {
  beforeEach(() => useChatroomsStore.setState({ chatrooms: [] }));

  it("adds, removes and clears chatrooms", () => {
    const { addChatroom, removeChatroom, emptyChatroomList } =
      useChatroomsStore.getState();
    addChatroom(makeChatroom("a", 0));
    addChatroom(makeChatroom("b", 1));
    expect(useChatroomsStore.getState().chatrooms).toHaveLength(2);

    removeChatroom("a");
    expect(
      useChatroomsStore.getState().chatrooms.map((c) => c.chatroomId),
    ).toEqual(["b"]);

    emptyChatroomList();
    expect(useChatroomsStore.getState().chatrooms).toEqual([]);
  });

  it("updates the unread count of only the matching chatroom", () => {
    useChatroomsStore
      .getState()
      .setChatroomList([makeChatroom("a", 0), makeChatroom("b", 1)]);
    useChatroomsStore.getState().updateChatroomUnread(5, "b");

    const [a, b] = useChatroomsStore.getState().chatrooms;
    expect(a.unreadMessages).toBe(0);
    expect(b.unreadMessages).toBe(5);
  });

  it("replaces a chatroom via updateChatroom", () => {
    useChatroomsStore.getState().setChatroomList([makeChatroom("a", 0)]);
    const updated = { ...makeChatroom("a", 0), unreadMessages: 9 };
    useChatroomsStore.getState().updateChatroom(updated);

    expect(useChatroomsStore.getState().chatrooms[0].unreadMessages).toBe(9);
  });

  it("swaps two chatrooms' positions while preserving their indexes", () => {
    const a = makeChatroom("a", 0);
    const b = makeChatroom("b", 1);
    useChatroomsStore.getState().setChatroomList([a, b]);
    useChatroomsStore.getState().swapChatroomOrder(a, b);

    const [first, second] = useChatroomsStore.getState().chatrooms;
    expect(first.chatroomId).toBe("b");
    expect(first.chatroomIndex).toBe(0);
    expect(second.chatroomId).toBe("a");
    expect(second.chatroomIndex).toBe(1);
  });
});

describe("useMessagesStore", () => {
  beforeEach(() => useMessagesStore.setState({ messages: [] }));

  it("prepends new messages and appends previous ones", () => {
    const { addNewMessage, addPreviousMessages } = useMessagesStore.getState();
    addNewMessage(makeMessage("2"));
    addNewMessage(makeMessage("3"));
    addPreviousMessages([makeMessage("1")]);

    expect(useMessagesStore.getState().messages.map((m) => m.id)).toEqual([
      "3",
      "2",
      "1",
    ]);
  });

  it("clears messages", () => {
    useMessagesStore.getState().setMessages([makeMessage("1")]);
    useMessagesStore.getState().clearMessages();
    expect(useMessagesStore.getState().messages).toEqual([]);
  });
});

describe("useInvitesStore", () => {
  beforeEach(() => useInvitesStore.setState({ invites: [] }));

  it("adds newest invites first and removes by id", () => {
    const invite = (id: string) => ({ id }) as never;
    useInvitesStore.getState().addNewInvite(invite("1"));
    useInvitesStore.getState().addNewInvite(invite("2"));
    expect(useInvitesStore.getState().invites.map((i) => i.id)).toEqual([
      "2",
      "1",
    ]);

    useInvitesStore.getState().removeInvite("2");
    expect(useInvitesStore.getState().invites.map((i) => i.id)).toEqual(["1"]);
  });
});

describe("useMembersStore", () => {
  beforeEach(() => useMembersStore.setState({ members: [] }));

  it("adds and removes members", () => {
    useMembersStore.getState().addNewMember(makeMember("1"));
    useMembersStore.getState().addNewMember(makeMember("2"));
    useMembersStore.getState().removeMember("1");

    expect(useMembersStore.getState().members.map((m) => m.memberId)).toEqual([
      "2",
    ]);
  });

  it("updates only a member's status", () => {
    useMembersStore.getState().setMembers([makeMember("1"), makeMember("2")]);
    useMembersStore.getState().updateMember(makeMember("1", "AWAY"));

    const [one, two] = useMembersStore.getState().members;
    expect(one.member.status).toBe("AWAY");
    expect(one.member.username).toBe("user-1");
    expect(two.member.status).toBe("ONLINE");
  });
});

describe("useTypingPresenceStore", () => {
  beforeEach(() => useTypingPresenceStore.setState({ typingUsers: [] }));

  it("adds, removes and pops typing users", () => {
    const { addTypingPresence, removeTypingPresence, popTypingUser } =
      useTypingPresenceStore.getState();
    addTypingPresence({ userId: "1", username: "a" } as never);
    addTypingPresence({ userId: "2", username: "b" } as never);
    addTypingPresence({ userId: "3", username: "c" } as never);

    removeTypingPresence("2");
    expect(
      useTypingPresenceStore.getState().typingUsers.map((u) => u.userId),
    ).toEqual(["1", "3"]);

    popTypingUser();
    expect(
      useTypingPresenceStore.getState().typingUsers.map((u) => u.userId),
    ).toEqual(["3"]);
  });
});

describe("useAuthStore", () => {
  beforeEach(() => useAuthStore.getState().handleLogOut());

  it("starts logged out", () => {
    expect(isLoggedInSelector(useAuthStore.getState())).toBe(false);
  });

  it("signs in and out", () => {
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    expect(isLoggedInSelector(useAuthStore.getState())).toBe(true);
    expect(useAuthStore.getState().user.username).toBe("alice");

    useAuthStore.getState().handleLogOut();
    expect(isLoggedInSelector(useAuthStore.getState())).toBe(false);
    expect(useAuthStore.getState().user.isGuest).toBe(true);
  });
});

describe("useActiveChatroomStore", () => {
  it("tracks the active chatroom", () => {
    useActiveChatroomStore.getState().setActiveChatroomId("c1");
    expect(useActiveChatroomStore.getState().activeChatroomId).toBe("c1");
    useActiveChatroomStore.getState().setActiveChatroomId(undefined);
    expect(useActiveChatroomStore.getState().activeChatroomId).toBeUndefined();
  });
});
