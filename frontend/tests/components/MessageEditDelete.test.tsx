import type { InfiniteData } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatMessage from "../../src/components/chat/ChatMessage";
import { useMessagePermissions } from "../../src/hooks/useMessagePermissions";
import { usePopoutStore } from "../../src/hooks/usePopoutStore";
import {
  useActiveChatroomStore,
  useAuthStore,
  useChatroomsStore,
  useMembersStore,
  useMessagesStore,
} from "../../src/hooks/useStores";
import type { ChatroomMember } from "../../src/types/REST-types/ChatroomMember";
import type { Message } from "../../src/types/REST-types/Message";
import { deleteMessage, editMessage } from "../../src/utils/messageChanges";
import { queryClient } from "../../src/utils/queryClient";
import {
  applyMessageDelete,
  applyMessageEdit,
} from "../../src/ws-router/ws-routes/message-changes";
import { renderWithProviders } from "../renderWithProviders";

vi.mock("../../src/utils/messageChanges", () => ({
  editMessage: vi.fn(() => Promise.resolve()),
  deleteMessage: vi.fn(() => Promise.resolve()),
}));

const makeMessage = (id: string, content = `msg ${id}`): Message => ({
  id,
  createdAt: new Date(0),
  chatroomId: "c1",
  content,
  senderUserId: "u1",
  senderUser: { id: "u1", username: "alice" },
  editedAt: null,
  attachment: null,
});

const props = {
  id: "m1",
  content: "helo world",
  sender: { id: "u1", username: "alice" },
  timestamp: new Date(2025, 0, 15, 14, 30),
};

beforeEach(() => vi.clearAllMocks());

describe("ChatMessage editing and deleting", () => {
  it("only shows the actions the user may take", () => {
    renderWithProviders(<ChatMessage {...props} canDelete />);
    expect(
      screen.getByRole("button", { name: "Delete message" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit message" })).toBeNull();
  });

  it("shows no toolbar on others' messages", () => {
    renderWithProviders(<ChatMessage {...props} />);
    expect(screen.queryByRole("button", { name: /message$/ })).toBeNull();
  });

  it("edits in place and saves on Enter", async () => {
    renderWithProviders(<ChatMessage {...props} canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));

    const input = screen.getByRole("textbox", { name: "Edit message" });
    expect(input).toHaveValue("helo world");
    fireEvent.change(input, { target: { value: " hello world " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(editMessage).toHaveBeenCalledWith("m1", "hello world");
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "Edit message" }),
      ).toBeNull(),
    );
  });

  it("cancels on Escape, and doesn't save unchanged or empty text", () => {
    renderWithProviders(<ChatMessage {...props} canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    let input = screen.getByRole("textbox", { name: "Edit message" });
    fireEvent.change(input, { target: { value: "changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("helo world")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    input = screen.getByRole("textbox", { name: "Edit message" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByRole("textbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    input = screen.getByRole("textbox", { name: "Edit message" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("alert")).toHaveTextContent(/can't be empty/);
    expect(editMessage).not.toHaveBeenCalled();
  });

  it("asks before deleting", async () => {
    renderWithProviders(<ChatMessage {...props} canDelete />);
    fireEvent.click(screen.getByRole("button", { name: "Delete message" }));

    expect(
      screen.getByText("helo world", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(deleteMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteMessage).toHaveBeenCalledWith("m1");
  });

  it("marks edited messages", () => {
    renderWithProviders(<ChatMessage {...props} editedAt={new Date()} />);
    expect(screen.getByText("(edited)")).toBeInTheDocument();
  });
});

describe("useMessagePermissions", () => {
  const own = { senderUserId: "me", attachment: null };
  const theirs = { senderUserId: "them", attachment: null };

  beforeEach(() => {
    useAuthStore.setState({
      user: { userId: "me", username: "me", token: "t", isGuest: false },
    });
    useChatroomsStore.setState({
      chatrooms: [
        {
          chatroomId: "c1",
          lastViewedAt: new Date(0),
          unreadMessages: 0,
          chatroomIndex: 1,
          folderId: null,
          chatroom: { title: "c1", privacy: "INVITE_ONLY", ownerId: "owner" },
        },
      ],
    });
    useMembersStore.setState({ members: [] });
    useActiveChatroomStore.setState({ activeChatroomId: undefined });
  });

  it("lets members edit and delete only their own messages", () => {
    const { result } = renderHook(() => useMessagePermissions("c1"));
    expect(result.current(own)).toMatchObject({
      canEdit: true,
      canDelete: true,
    });
    expect(result.current(theirs)).toMatchObject({
      canEdit: false,
      canDelete: false,
    });
    // files can be deleted but not edited
    expect(
      result.current({
        ...own,
        attachment: { id: "a", fileName: "f", mimeType: "text/plain", size: 1 },
      }),
    ).toMatchObject({ canEdit: false, canDelete: true });
  });

  it("lets the owner and admins delete anyone's messages", () => {
    useChatroomsStore.setState((s) => ({
      chatrooms: s.chatrooms.map((c) => ({
        ...c,
        chatroom: { ...c.chatroom, ownerId: "me" },
      })),
    }));
    const { result } = renderHook(() => useMessagePermissions("c1"));
    expect(result.current(theirs)).toMatchObject({
      canEdit: false,
      canDelete: true,
    });
  });

  it("uses the member's role in the open chatroom", () => {
    useActiveChatroomStore.setState({ activeChatroomId: "c1" });
    useMembersStore.setState({
      members: [
        {
          memberId: "me",
          role: "ADMIN",
          member: { username: "me", status: "ONLINE" },
        },
      ] as unknown as ChatroomMember[],
    });
    const { result } = renderHook(() => useMessagePermissions("c1"));
    expect(result.current(theirs).canDelete).toBe(true);

    // the role is for the open chatroom only
    const other = renderHook(() => useMessagePermissions("c2"));
    expect(other.result.current(theirs).canDelete).toBe(false);
  });
});

describe("applying message changes", () => {
  beforeEach(() => {
    useMessagesStore.setState({
      messages: [makeMessage("m1"), makeMessage("m2")],
    });
    usePopoutStore.setState({
      liveMessages: { c1: [makeMessage("m1")] },
    });
    queryClient.setQueryData<InfiniteData<Message[]>>(
      ["messageHistory", "c1", "u1", "x"],
      { pages: [[makeMessage("m1"), makeMessage("m2")]], pageParams: [null] },
    );
  });

  it("replaces an edited message everywhere it's shown", () => {
    act(() => applyMessageEdit(makeMessage("m1", "edited")));

    expect(useMessagesStore.getState().messages[0].content).toBe("edited");
    expect(usePopoutStore.getState().liveMessages.c1[0].content).toBe("edited");
    const history = queryClient.getQueryData<InfiniteData<Message[]>>([
      "messageHistory",
      "c1",
      "u1",
      "x",
    ]);
    expect(history?.pages[0].map((m) => m.content)).toEqual([
      "edited",
      "msg m2",
    ]);
  });

  it("removes a deleted message everywhere it's shown", () => {
    act(() => applyMessageDelete("c1", "m1"));

    expect(useMessagesStore.getState().messages.map((m) => m.id)).toEqual([
      "m2",
    ]);
    expect(usePopoutStore.getState().liveMessages.c1).toEqual([]);
    const history = queryClient.getQueryData<InfiniteData<Message[]>>([
      "messageHistory",
      "c1",
      "u1",
      "x",
    ]);
    expect(history?.pages[0].map((m) => m.id)).toEqual(["m2"]);
  });
});
