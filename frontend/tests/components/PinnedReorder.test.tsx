import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createEvent,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PinnedChatroomsList } from "../../src/components/chat-home/PinnedChatroomsList";
import { PinChatroomsModal } from "../../src/components/chat-home/PinChatroomsModal";
import { usePreferencesStore } from "../../src/hooks/usePreferencesStore";
import { useAuthStore, useChatroomsStore } from "../../src/hooks/useStores";
import type {
  Chatroom,
  PinnedGroup,
} from "../../src/types/REST-types/Chatroom";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const titles: Record<string, string> = { a: "Alpha", b: "Beta", c: "Gamma" };

const group: PinnedGroup = {
  id: "g1",
  userId: "u1",
  name: "Work",
  createdAt: new Date(0),
  chatrooms: ["a", "b", "c"].map((id, i) => ({
    chatroomId: id,
    chatroom: { title: titles[id] },
    pinnedIndex: i + 1,
  })),
};

const makeChatroom = (id: string, index: number, folderId: string | null) =>
  ({
    chatroomId: id,
    lastViewedAt: new Date(0),
    unreadMessages: 0,
    chatroomIndex: index,
    folderId,
    chatroom: { title: titles[id], privacy: "INVITE_ONLY", ownerId: "u1" },
  }) as Chatroom;

// a DataTransfer stand-in for jsdom
const dataTransfer = () => {
  const data: Record<string, string> = {};
  return {
    setData: (type: string, value: string) => (data[type] = value),
    getData: (type: string) => data[type] ?? "",
    effectAllowed: "",
    dropEffect: "",
  };
};

// drag `from` onto the far half of `to` (jsdom boxes are all 0 in size)
const drag = (from: Element, to: Element, after = true) => {
  const transfer = dataTransfer();
  fireEvent.dragStart(from, { dataTransfer: transfer });
  // jsdom has no DragEvent, so the cursor position is set by hand
  const over = createEvent.dragOver(to, { dataTransfer: transfer });
  for (const key of ["clientX", "clientY"]) {
    Object.defineProperty(over, key, { value: after ? 10 : -10 });
  }
  fireEvent(to, over);
  fireEvent.drop(to, { dataTransfer: transfer });
  fireEvent.dragEnd(from, { dataTransfer: transfer });
};

const withQueryClient = (ui: React.ReactElement) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {ui}
  </QueryClientProvider>
);

describe("reordering pinned chatrooms", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    HTMLDialogElement.prototype.show ??= vi.fn();
    HTMLDialogElement.prototype.showModal ??= vi.fn();
    HTMLDialogElement.prototype.close ??= vi.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.getState().setPreference("syncFoldersWithHome", false);
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    useChatroomsStore
      .getState()
      .setChatroomList([
        makeChatroom("a", 1, "f1"),
        makeChatroom("b", 2, "f1"),
        makeChatroom("c", 3, "f1"),
      ]);
    fetchMock = vi.fn((url: string) =>
      jsonResponse(
        url.includes("/api/pinned/me")
          ? [group]
          : url.endsWith("/api/folders")
            ? [{ id: "f1", name: "Work", index: 1 }]
            : url.includes("/api/messages/")
              ? []
              : { message: "ok" },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const orderRequest = (path: string) =>
    fetchMock.mock.calls.find(
      ([url, init]) => url.endsWith(path) && init?.method === "PATCH",
    );

  describe("carousel cards", () => {
    it("reports the new order when a card is dragged onto another", () => {
      const onReorder = vi.fn();
      renderWithProviders(
        withQueryClient(
          <PinnedChatroomsList pinnedGroup={group} onReorder={onReorder} />,
        ),
      );
      const card = (title: string) =>
        screen.getByRole("link", { name: title }).closest("li")!;

      drag(card("Alpha"), card("Gamma"));
      expect(onReorder).toHaveBeenLastCalledWith(["b", "c", "a"]);

      drag(card("Gamma"), card("Alpha"), false);
      expect(onReorder).toHaveBeenLastCalledWith(["c", "a", "b"]);
    });

    it("does nothing when a card is dropped where it was", () => {
      const onReorder = vi.fn();
      renderWithProviders(
        withQueryClient(
          <PinnedChatroomsList pinnedGroup={group} onReorder={onReorder} />,
        ),
      );
      const alpha = screen.getByRole("link", { name: "Alpha" }).closest("li")!;
      const beta = screen.getByRole("link", { name: "Beta" }).closest("li")!;

      drag(alpha, beta, false);
      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe("the group's pinned list", () => {
    const renderModal = () =>
      renderWithProviders(
        withQueryClient(
          <PinChatroomsModal open onClose={() => {}} pinnedGroup={group} />,
        ),
      );
    const rows = () =>
      within(
        screen.getByText("Pinned").closest(".field") as HTMLElement,
      ).getAllByRole("listitem", { hidden: true });

    it("lists chatrooms in the group's order", () => {
      renderModal();
      expect(rows().map((r) => r.textContent)).toEqual([
        expect.stringContaining("Alpha"),
        expect.stringContaining("Beta"),
        expect.stringContaining("Gamma"),
      ]);
    });

    it("saves the order after dragging a chatroom name", async () => {
      renderModal();
      const [alpha, , gamma] = rows();

      drag(alpha, gamma);

      await waitFor(() =>
        expect(orderRequest("/api/pinned/g1/order")).toBeTruthy(),
      );
      expect(JSON.parse(orderRequest("/api/pinned/g1/order")![1].body)).toEqual(
        {
          chatroomIds: ["b", "c", "a"],
        },
      );
    });

    it("moves chatrooms with the up and down buttons", async () => {
      renderModal();

      expect(
        screen.getByRole("button", { name: "Move Alpha up", hidden: true }),
      ).toBeDisabled();
      fireEvent.click(
        screen.getByRole("button", { name: "Move Gamma up", hidden: true }),
      );

      await waitFor(() =>
        expect(orderRequest("/api/pinned/g1/order")).toBeTruthy(),
      );
      expect(JSON.parse(orderRequest("/api/pinned/g1/order")![1].body)).toEqual(
        {
          chatroomIds: ["a", "c", "b"],
        },
      );
    });

    it("reorders the folder, and the sidebar, when folders are synced", async () => {
      usePreferencesStore.getState().setPreference("syncFoldersWithHome", true);
      renderWithProviders(
        withQueryClient(
          <PinChatroomsModal
            open
            onClose={() => {}}
            pinnedGroup={{ ...group, id: "f1" }}
          />,
        ),
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Move Alpha down", hidden: true }),
      );

      expect(
        useChatroomsStore.getState().chatrooms.map((c) => c.chatroomId),
      ).toEqual(["b", "a", "c"]);
      await waitFor(() =>
        expect(orderRequest("/api/folders/f1/order")).toBeTruthy(),
      );
      expect(
        JSON.parse(orderRequest("/api/folders/f1/order")![1].body),
      ).toEqual({
        chatroomIds: ["b", "a", "c"],
      });
    });
  });
});
