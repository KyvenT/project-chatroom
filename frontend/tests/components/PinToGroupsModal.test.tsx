import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PinToGroupsModal } from "../../src/components/chat-home/PinToGroupsModal";
import { useAuthStore } from "../../src/hooks/useStores";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

const initialGroups = () => [
  {
    id: "g1",
    name: "Work",
    chatrooms: [
      { chatroomId: "c1", chatroom: { title: "Room" }, pinnedIndex: 1 },
    ],
  },
  { id: "g2", name: "Friends", chatrooms: [] as unknown[] },
];

describe("PinToGroupsModal", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    // jsdom doesn't implement <dialog> methods
    HTMLDialogElement.prototype.show ??= vi.fn();
    HTMLDialogElement.prototype.showModal ??= vi.fn();
    HTMLDialogElement.prototype.close ??= vi.fn();
  });

  beforeEach(() => {
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    // a fake server that remembers pins, so the refetch after a change
    // returns the updated groups
    const groups = initialGroups();
    fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (!init?.method || init.method === "GET") return jsonResponse(groups);

      const { pin, pinGroupId } = JSON.parse(init.body as string);
      const group = groups.find((g) => g.id === pinGroupId)!;
      group.chatrooms = pin
        ? [{ chatroomId: "c1", chatroom: { title: "Room" }, pinnedIndex: 1 }]
        : [];
      return jsonResponse({ message: "chatroom pin updated" });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const renderModal = () =>
    renderWithProviders(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <PinToGroupsModal
          open
          onClose={() => {}}
          chatroom={{ chatroomId: "c1", title: "Room" }}
        />
      </QueryClientProvider>,
    );

  it("shows which groups the chatroom is pinned in", async () => {
    renderModal();

    expect(
      await screen.findByRole("checkbox", { name: /Work/, hidden: true }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("checkbox", { name: /Friends/, hidden: true }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("pins the chatroom when an unchecked group is clicked", async () => {
    renderModal();
    const friends = await screen.findByRole("checkbox", {
      name: /Friends/,
      hidden: true,
    });

    fireEvent.click(friends);

    await waitFor(() =>
      expect(friends).toHaveAttribute("aria-checked", "true"),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/pinned/c1/pin"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ pin: true, pinGroupId: "g2" }),
        }),
      ),
    );
  });

  it("unpins the chatroom when a checked group is clicked", async () => {
    renderModal();
    const work = await screen.findByRole("checkbox", {
      name: /Work/,
      hidden: true,
    });

    fireEvent.click(work);

    await waitFor(() => expect(work).toHaveAttribute("aria-checked", "false"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/pinned/c1/pin"),
        expect.objectContaining({
          body: JSON.stringify({ pin: false, pinGroupId: "g1" }),
        }),
      ),
    );
  });
});
