import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Sidebar from "../../src/components/chat-layout/Sidebar";
import { MoveToFolderModal } from "../../src/components/chat-layout/folders/MoveToFolderModal";
import { useAuthStore, useChatroomsStore } from "../../src/hooks/useStores";
import type { Chatroom } from "../../src/types/REST-types/Chatroom";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const makeChatroom = (
  id: string,
  title: string,
  folderId: string | null,
  unreadMessages = 0,
): Chatroom => ({
  chatroomId: id,
  lastViewedAt: new Date(0),
  unreadMessages,
  chatroomIndex: Number(id.slice(1)),
  folderId,
  chatroom: { title, privacy: "INVITE_ONLY", ownerId: "u1" },
});

const folders = [{ id: "f1", name: "Work", index: 1 }];

// a DataTransfer stand-in carrying a dragged sidebar chatroom
const dragData = (chatroom: Chatroom) => ({
  getData: () => JSON.stringify({ firstChatroom: chatroom }),
});

describe("sidebar folders", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // jsdom doesn't implement <dialog> methods
    HTMLDialogElement.prototype.show ??= vi.fn();
    HTMLDialogElement.prototype.showModal ??= vi.fn();
    HTMLDialogElement.prototype.close ??= vi.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    useChatroomsStore
      .getState()
      .setChatroomList([
        makeChatroom("c1", "Standup", "f1", 3),
        makeChatroom("c2", "Book club", null),
      ]);
    fetchMock = vi.fn((url: string) =>
      jsonResponse(url.endsWith("/api/folders") ? folders : { message: "ok" }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const withQueryClient = (ui: React.ReactElement) => (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>
  );

  const renderSidebar = () =>
    renderWithProviders(
      withQueryClient(
        <Sidebar chatrooms={useChatroomsStore.getState().chatrooms} />,
      ),
    );

  it("shows chatrooms under their folder and the rest under Chats", async () => {
    renderSidebar();

    const work = await screen.findByRole("region", { name: "Work" });
    const chats = screen.getByRole("region", { name: "Chats" });
    expect(within(work).getByText("Standup")).toBeInTheDocument();
    expect(within(chats).getByText("Book club")).toBeInTheDocument();
    expect(within(chats).queryByText("Standup")).not.toBeInTheDocument();
  });

  it("collapses a folder and shows its unread total instead", async () => {
    renderSidebar();
    const toggle = await screen.findByRole("button", { name: "Work" });

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Standup")).not.toBeInTheDocument();
    expect(screen.getByLabelText("3 unread")).toBeInTheDocument();
  });

  it("moves a chatroom into a folder when dropped on it", async () => {
    renderSidebar();
    const work = await screen.findByRole("region", { name: "Work" });

    fireEvent.drop(work, {
      dataTransfer: dragData(makeChatroom("c2", "Book club", null)),
    });

    expect(
      useChatroomsStore.getState().chatrooms.find((c) => c.chatroomId === "c2")
        ?.folderId,
    ).toBe("f1");
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/folders/chatrooms/c2"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ folderId: "f1" }),
        }),
      ),
    );
  });

  it("moves a chatroom out of its folder when dropped on a Chats row", async () => {
    renderSidebar();
    await screen.findByRole("region", { name: "Work" });

    fireEvent.drop(screen.getByText("Book club").closest("li")!, {
      dataTransfer: dragData(makeChatroom("c1", "Standup", "f1")),
    });

    expect(
      useChatroomsStore.getState().chatrooms.find((c) => c.chatroomId === "c1")
        ?.folderId,
    ).toBeNull();
  });

  it("puts a chatroom back if the move fails", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.endsWith("/api/folders")
        ? jsonResponse(folders)
        : Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ message: "boom" }),
          }),
    );
    renderSidebar();
    const work = await screen.findByRole("region", { name: "Work" });

    fireEvent.drop(work, {
      dataTransfer: dragData(makeChatroom("c2", "Book club", null)),
    });

    await waitFor(() =>
      expect(
        useChatroomsStore
          .getState()
          .chatrooms.find((c) => c.chatroomId === "c2")?.folderId,
      ).toBeNull(),
    );
  });

  it("moves a chatroom by picking a folder in the move modal", async () => {
    renderWithProviders(
      withQueryClient(
        <MoveToFolderModal
          open
          onClose={() => {}}
          chatroom={{ chatroomId: "c2", title: "Book club" }}
        />,
      ),
    );

    const none = screen.getByRole("radio", {
      name: "No folder (Chats)",
      hidden: true,
    });
    expect(none).toHaveAttribute("aria-checked", "true");

    fireEvent.click(
      await screen.findByRole("radio", { name: "Work", hidden: true }),
    );

    expect(
      screen.getByRole("radio", { name: "Work", hidden: true }),
    ).toHaveAttribute("aria-checked", "true");
    expect(none).toHaveAttribute("aria-checked", "false");
  });
});
