import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "../../src/components/chat-layout/Sidebar";
import { useAuthStore, useChatroomsStore } from "../../src/hooks/useStores";
import type { Chatroom } from "../../src/types/REST-types/Chatroom";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const makeChatroom = (id: string, title: string, folderId: string | null) =>
  ({
    chatroomId: id,
    lastViewedAt: new Date(0),
    unreadMessages: 0,
    chatroomIndex: Number(id.slice(1)),
    folderId,
    chatroom: { title, privacy: "INVITE_ONLY", ownerId: "u1" },
  }) as Chatroom;

const folders = [
  { id: "work", name: "Work", index: 1 },
  { id: "games", name: "Games", index: 2 },
];

describe("sidebar search", () => {
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
        makeChatroom("c1", "Standup", "work"),
        makeChatroom("c2", "Design reviews", "work"),
        makeChatroom("c3", "Chess club", "games"),
        makeChatroom("c4", "Book club", null),
        makeChatroom("c5", "Random", null),
      ]);
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        jsonResponse(url.endsWith("/api/folders") ? folders : []),
      ),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const renderSidebar = async () => {
    renderWithProviders(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <Sidebar chatrooms={useChatroomsStore.getState().chatrooms} />
      </QueryClientProvider>,
    );
    await screen.findByRole("region", { name: "Work" });
    return screen.getByRole("searchbox", {
      name: "Search chatrooms and folders",
    });
  };
  const search = (input: HTMLElement, value: string) =>
    fireEvent.change(input, { target: { value } });
  const shownChatrooms = () =>
    within(document.getElementById("sidebar-chatrooms")!)
      .queryAllByRole("link")
      .map((link) => link.textContent);
  const shownSections = () =>
    screen.queryAllByRole("region").map((r) => r.getAttribute("aria-label"));

  it("filters chatrooms by title, keeping the folders they're in", async () => {
    const input = await renderSidebar();
    search(input, "CLUB");

    expect(shownChatrooms()).toEqual(["Chess club", "Book club"]);
    expect(shownSections()).toEqual(["Games", "Chats"]);
  });

  it("shows a folder with all its chatrooms when its name matches", async () => {
    const input = await renderSidebar();
    search(input, "work");

    expect(shownSections()).toEqual(["Work"]);
    expect(shownChatrooms()).toEqual(["Standup", "Design reviews"]);
  });

  it("highlights the matching text", async () => {
    const input = await renderSidebar();
    search(input, "des");

    const link = screen.getByRole("link", { name: "Design reviews" });
    expect(within(link).getByText("Des").tagName).toBe("MARK");
  });

  it("expands collapsed sections while searching", async () => {
    const input = await renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Games" }));
    expect(screen.queryByText("Chess club")).toBeNull();

    search(input, "chess");
    expect(shownChatrooms()).toEqual(["Chess club"]);

    // and they're collapsed again afterwards
    search(input, "");
    expect(screen.queryByText("Chess club")).toBeNull();
  });

  it("names the icon-only home and settings links", async () => {
    await renderSidebar();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    const input = await renderSidebar();
    search(input, "zzz");

    expect(screen.getByText("No chats or folders match “zzz”")).toBeVisible();
    expect(shownChatrooms()).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent("0 results");
  });

  it("clears with the clear button or Escape", async () => {
    const input = await renderSidebar();
    search(input, "chess");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(shownChatrooms()).toHaveLength(5);

    search(input, "chess");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
    expect(shownChatrooms()).toHaveLength(5);
  });
});
