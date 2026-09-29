import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PinnedChatroomsList } from "../../src/components/chat-home/PinnedChatroomsList";
import { useAuthStore } from "../../src/hooks/useStores";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

// newest first, like the API
const makeMessages = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => {
    const n = from - i;
    return {
      id: `m${n}`,
      content: `message ${n}`,
      chatroomId: "c1",
      senderUserId: "u2",
      senderUser: { id: "u2", username: "bob" },
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
      editedAt: null,
    };
  });

const group = {
  id: "g1",
  userId: "u1",
  name: "Work",
  createdAt: new Date(),
  chatrooms: [
    { chatroomId: "c1", chatroom: { title: "Room" }, pinnedIndex: 1 },
  ],
};

const params = (call: unknown[]) =>
  new URL(call[0] as string, "http://localhost").searchParams;

describe("PinnedChatroomsList", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderList = () =>
    renderWithProviders(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <PinnedChatroomsList pinnedGroup={group} />
      </QueryClientProvider>,
    );

  // give every message list a scrollable size; scrollTop 0 is the bottom of
  // a column-reverse list
  const mockScrollSize = (scrollHeight: number, clientHeight: number) => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
      scrollHeight,
    );
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
      clientHeight,
    );
  };

  it("shows the 5 latest messages, then older ones when scrolled to the top", async () => {
    mockScrollSize(500, 100);
    fetchMock
      .mockReturnValueOnce(jsonResponse(makeMessages(20, 5)))
      .mockReturnValueOnce(jsonResponse(makeMessages(15, 15)));
    renderList();

    expect(await screen.findByText("message 20")).toBeInTheDocument();
    expect(params(fetchMock.mock.calls[0]).get("limit")).toBe("5");
    // not at the top yet, so nothing older is fetched
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const list = screen.getByText("message 16").closest("ul")!;
    list.scrollTop = -400;
    fireEvent.scroll(list);

    expect(await screen.findByText("message 15")).toBeInTheDocument();
    const older = params(fetchMock.mock.calls[1]);
    expect(older.get("limit")).toBe("15");
    expect(older.get("getBefore")).toBe(makeMessages(16, 1)[0].createdAt);
  });

  it("keeps loading when the messages don't fill the preview, until history runs out", async () => {
    mockScrollSize(100, 100);
    fetchMock
      .mockReturnValueOnce(jsonResponse(makeMessages(20, 5)))
      .mockReturnValueOnce(jsonResponse(makeMessages(15, 3)));
    renderList();

    expect(await screen.findByText("Start of chat")).toBeInTheDocument();
    expect(screen.getByText("message 13")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("says when a chatroom has no messages", async () => {
    fetchMock.mockReturnValueOnce(jsonResponse([]));
    renderList();

    expect(await screen.findByText("No messages yet")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
