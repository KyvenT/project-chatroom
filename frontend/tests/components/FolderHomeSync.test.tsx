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
import ChatHome from "../../src/router/routes/chat/ChatHome";
import { SettingsPage } from "../../src/router/routes/utility/Settings";
import { usePreferencesStore } from "../../src/hooks/usePreferencesStore";
import { useAuthStore, useChatroomsStore } from "../../src/hooks/useStores";
import type { Chatroom } from "../../src/types/REST-types/Chatroom";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const makeChatroom = (
  id: string,
  title: string,
  folderId: string | null,
): Chatroom => ({
  chatroomId: id,
  lastViewedAt: new Date(0),
  unreadMessages: 0,
  chatroomIndex: Number(id.slice(1)),
  folderId,
  chatroom: { title, privacy: "INVITE_ONLY", ownerId: "u1" },
});

const pinnedGroups = [
  {
    id: "g1",
    userId: "u1",
    name: "Pinned stuff",
    createdAt: "",
    chatrooms: [],
  },
];
const folders = [{ id: "f1", name: "Work", index: 1 }];

const signIn = (isGuest = false) =>
  useAuthStore.getState().handleSignIn({
    userId: "u1",
    username: "alice",
    token: "tok",
    isGuest,
  });

describe("syncing sidebar folders with the home page", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    HTMLDialogElement.prototype.show ??= vi.fn();
    HTMLDialogElement.prototype.showModal ??= vi.fn();
    HTMLDialogElement.prototype.close ??= vi.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    usePreferencesStore.getState().setPreference("syncFoldersWithHome", false);
    signIn();
    useChatroomsStore
      .getState()
      .setChatroomList([
        makeChatroom("c1", "Standup", "f1"),
        makeChatroom("c2", "Book club", null),
      ]);
    fetchMock = vi.fn((url: string) => {
      if (url.includes("/api/pinned/me")) return jsonResponse(pinnedGroups);
      if (url.endsWith("/api/folders")) return jsonResponse(folders);
      if (url.includes("/api/messages/")) return jsonResponse([]);
      return jsonResponse({ message: "ok" });
    });
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

  it("turns sync on from settings and remembers it", () => {
    renderWithProviders(<SettingsPage />);
    const toggle = screen.getByRole("switch", {
      name: "Sync sidebar folders with home page groups",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(JSON.parse(localStorage.getItem("preferences")!)).toEqual({
      syncFoldersWithHome: true,
    });
  });

  it("can't be turned on by guests", () => {
    signIn(true);
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("shows pinned groups on the home page when sync is off", async () => {
    renderWithProviders(withQueryClient(<ChatHome />));

    expect(
      await screen.findByRole("button", { name: /Pinned stuff/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Work/ })).toBeNull();
  });

  it("shows sidebar folders and their chatrooms when sync is on", async () => {
    usePreferencesStore.getState().setPreference("syncFoldersWithHome", true);
    renderWithProviders(withQueryClient(<ChatHome />));

    expect(
      await screen.findByRole("button", { name: /Work/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Standup")).toBeInTheDocument();
    expect(screen.queryByText("Pinned stuff")).not.toBeInTheDocument();
    expect(screen.getByText("Edit folder")).toBeInTheDocument();
    expect(
      screen.getByText("Showing your sidebar folders."),
    ).toBeInTheDocument();
  });

  it("moves chatrooms in and out of the folder from the home page", async () => {
    usePreferencesStore.getState().setPreference("syncFoldersWithHome", true);
    renderWithProviders(withQueryClient(<ChatHome />));
    fireEvent.click(await screen.findByText("Edit folder"));

    const folderOf = (id: string) =>
      useChatroomsStore.getState().chatrooms.find((c) => c.chatroomId === id)
        ?.folderId;

    const add = await screen.findByRole("button", {
      name: /Book club.*Add/,
      hidden: true,
    });
    fireEvent.click(add);
    expect(folderOf("c2")).toBe("f1");

    const inFolder = screen
      .getByText("In this folder")
      .closest(".field") as HTMLElement;
    fireEvent.click(
      within(inFolder).getByRole("button", {
        name: /Standup.*Remove/,
        hidden: true,
      }),
    );
    expect(folderOf("c1")).toBeNull();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/folders/chatrooms/c1"),
        expect.objectContaining({ body: JSON.stringify({ folderId: null }) }),
      ),
    );
  });
});
