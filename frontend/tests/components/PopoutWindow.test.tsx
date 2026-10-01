import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ws-router/ws", () => ({ sendWSMessage: vi.fn() }));

import { sendWSMessage } from "../../src/ws-router/ws";
import { PopoutDock } from "../../src/components/popout/PopoutDock";
import { PopoutWindow } from "../../src/components/popout/PopoutWindow";
import { openChatWindow } from "../../src/components/popout/chatWindow";
import { usePopoutStore } from "../../src/hooks/usePopoutStore";
import { useAuthStore, useChatroomsStore } from "../../src/hooks/useStores";
import type { Chatroom } from "../../src/types/REST-types/Chatroom";
import { renderWithProviders } from "../renderWithProviders";
import { queryClient } from "../../src/utils/queryClient";
import { handleStatusUpdate } from "../../src/ws-router/ws-routes/status-update";
import { handleUpdateMembers } from "../../src/ws-router/ws-routes/update-members";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const makeChatroom = (id: string, title: string, unreadMessages = 0) =>
  ({
    chatroomId: id,
    lastViewedAt: new Date(0),
    unreadMessages,
    chatroomIndex: 1,
    folderId: null,
    chatroom: { title, privacy: "INVITE_ONLY", ownerId: "u1" },
  }) as Chatroom;

// jsdom has no picture-in-picture, so windows are iframes, which have their
// own window and document like the real thing
let frames: HTMLIFrameElement[] = [];
const requestWindow = vi.fn(async () => {
  const frame = document.createElement("iframe");
  document.body.appendChild(frame);
  frames.push(frame);
  const win = frame.contentWindow!;
  win.close = vi.fn(() => win.dispatchEvent(new Event("pagehide")));
  return win;
});
const chatWindowDoc = () => usePopoutStore.getState().chatWindow!.document;
const inWindow = () => within(chatWindowDoc().body);

const sent = () => vi.mocked(sendWSMessage).mock.calls.map(([m]) => m);

describe("chat window (picture-in-picture)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(sendWSMessage).mockClear();
    requestWindow.mockClear();
    window.documentPictureInPicture = { requestWindow };
    usePopoutStore.setState({
      popouts: [],
      liveMessages: {},
      chatWindow: null,
      windowTabs: [],
      activeWindowTab: null,
    });
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    useChatroomsStore
      .getState()
      .setChatroomList([
        makeChatroom("c1", "Standup"),
        makeChatroom("c2", "Design", 3),
      ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse([])),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.documentPictureInPicture;
    frames.forEach((f) => f.remove());
    frames = [];
  });

  const renderApp = (
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  ) =>
    renderWithProviders(
      <QueryClientProvider client={client}>
        <PopoutDock />
        <PopoutWindow />
      </QueryClientProvider>,
    );

  it("offers popping a docked chat out to a window when supported", () => {
    usePopoutStore.getState().open("c1");
    renderApp();
    expect(
      screen.getByRole("button", { name: "Pop Standup out to a window" }),
    ).toBeInTheDocument();
  });

  it("doesn't offer it in browsers without picture-in-picture", () => {
    delete window.documentPictureInPicture;
    usePopoutStore.getState().open("c1");
    renderApp();
    expect(
      screen.queryByRole("button", { name: "Pop Standup out to a window" }),
    ).toBeNull();
  });

  it("moves the chat from the dock into the window", async () => {
    usePopoutStore.getState().open("c1");
    renderApp();

    fireEvent.click(
      screen.getByRole("button", { name: "Pop Standup out to a window" }),
    );

    await waitFor(() =>
      expect(
        inWindow().getByRole("textbox", { name: "Message Standup" }),
      ).toBeInTheDocument(),
    );
    expect(requestWindow).toHaveBeenCalledOnce();
    expect(screen.queryByRole("region", { name: "Standup chat" })).toBeNull();
    // its styles are put in the window's own document
    expect(chatWindowDoc().head.querySelector("style")).not.toBeNull();
  });

  it("sends messages from the window and watches its chat", async () => {
    renderApp();
    await act(() => openChatWindow("c1"));
    const input = inWindow().getByRole("textbox", { name: "Message Standup" });

    fireEvent.change(input, { target: { value: "from the window" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(sent()).toContainEqual({
      type: "message",
      content: "from the window",
      chatroomId: "c1",
    });
    expect(sent()).toContainEqual({
      type: "update-watched-chatrooms",
      chatroomIds: ["c1"],
    });
  });

  it("adds more chats as tabs in the same window", async () => {
    renderApp();
    await act(() => openChatWindow("c1"));
    await act(() => openChatWindow("c2"));

    expect(requestWindow).toHaveBeenCalledOnce();
    const tabs = inWindow().getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Standup", "Design"]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.click(tabs[0]);
    expect(
      inWindow().getByRole("textbox", { name: "Message Standup" }),
    ).toBeInTheDocument();
    // the tab that isn't showing counts new messages as unread
    act(() => useChatroomsStore.getState().updateChatroomUnread(3, "c2"));
    expect(inWindow().getByLabelText("3 unread")).toBeInTheDocument();
  });

  it("opens another chat from the + button after the tabs", async () => {
    useChatroomsStore.getState().setChatroomList([
      { ...makeChatroom("c1", "Standup"), chatroomIndex: 1 },
      { ...makeChatroom("c3", "Random"), chatroomIndex: 3 },
      { ...makeChatroom("c2", "Design", 3), chatroomIndex: 2 },
    ]);
    renderApp();
    await act(() => openChatWindow("c1"));

    fireEvent.click(
      inWindow().getByRole("button", { name: "Open another chat" }),
    );
    const menu = inWindow().getByRole("dialog", { name: "Open another chat" });
    // the chats not already open, in sidebar order, with unread counts
    const choices = within(menu).getAllByRole("button");
    expect(choices.map((c) => c.textContent)).toEqual(["Design3", "Random"]);

    fireEvent.click(choices[1]);
    const tabs = inWindow().getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Standup", "Random"]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(inWindow().queryByRole("dialog")).toBeNull();
  });

  it("finds a chat to open by typing, picked with Enter", async () => {
    useChatroomsStore
      .getState()
      .setChatroomList([
        makeChatroom("c1", "Standup"),
        makeChatroom("c2", "Design"),
        makeChatroom("c3", "Random"),
      ]);
    renderApp();
    await act(() => openChatWindow("c1"));

    fireEvent.click(
      inWindow().getByRole("button", { name: "Open another chat" }),
    );
    const search = inWindow().getByRole("searchbox", { name: "Find a chat" });
    fireEvent.change(search, { target: { value: "ran" } });
    expect(
      within(inWindow().getByRole("dialog")).getAllByRole("button"),
    ).toHaveLength(1);

    fireEvent.keyDown(search, { key: "Enter" });
    expect(usePopoutStore.getState().activeWindowTab).toBe("c3");

    // and says so when nothing matches or everything's open
    fireEvent.click(
      inWindow().getByRole("button", { name: "Open another chat" }),
    );
    fireEvent.change(inWindow().getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    expect(inWindow().getByText("No chats match")).toBeInTheDocument();
  });

  it("closes the + menu on Escape or a click elsewhere in the window", async () => {
    renderApp();
    await act(() => openChatWindow("c1"));
    const plus = inWindow().getByRole("button", { name: "Open another chat" });

    fireEvent.click(plus);
    fireEvent.keyDown(inWindow().getByRole("searchbox"), { key: "Escape" });
    expect(inWindow().queryByRole("dialog")).toBeNull();

    fireEvent.click(plus);
    fireEvent.mouseDown(chatWindowDoc().body);
    expect(inWindow().queryByRole("dialog")).toBeNull();
  });

  describe("members panel", () => {
    const member = (
      memberId: string,
      username: string,
      status: "ONLINE" | "AWAY" | "OFFLINE",
      role = "MEMBER",
    ) => ({ memberId, role, member: { username, status } });

    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string) =>
          jsonResponse(
            url.endsWith("/api/members/c1/u2")
              ? {
                  joinedAt: "2026-03-04T00:00:00.000Z",
                  member: {
                    id: "u2",
                    username: "bob",
                    isGuest: false,
                    createdAt: "2025-01-02T00:00:00.000Z",
                  },
                }
              : url.endsWith("/api/members/c1")
                ? [
                    member("u1", "alice", "ONLINE", "OWNER"),
                    member("u2", "bob", "OFFLINE"),
                    member("u3", "carol", "AWAY"),
                  ]
                : [],
          ),
        ),
      );
    });

    const toggle = () =>
      inWindow().getByRole("button", { name: /^(Show|Hide) members$/ });

    it("is hidden until its button, first of the window's buttons, is pressed", async () => {
      renderApp();
      await act(() => openChatWindow("c1"));
      expect(inWindow().queryByRole("complementary")).toBeNull();

      // leftmost of the buttons on the right of the header
      const header = toggle().parentElement!;
      const buttons = within(header)
        .getAllByRole("button")
        .filter((b) => !b.closest(".tabs"));
      expect(buttons[1]).toBe(toggle());
      expect(buttons[0]).toHaveAccessibleName("Open another chat");

      fireEvent.click(toggle());
      expect(toggle()).toHaveAttribute("aria-pressed", "true");
      const panel = inWindow().getByRole("complementary", { name: "Members" });
      await waitFor(() =>
        expect(within(panel).getByText("Members — 3")).toBeInTheDocument(),
      );
      expect(
        within(panel)
          .getAllByRole("heading")
          .map((h) => h.textContent),
      ).toEqual(["Online — 1", "Away — 1", "Offline — 1"]);
      expect(within(panel).getByText("Owner")).toBeInTheDocument();

      fireEvent.click(toggle());
      expect(inWindow().queryByRole("complementary")).toBeNull();
    });

    it("opens a member's profile in the window when they're clicked", async () => {
      renderApp();
      await act(() => openChatWindow("c1"));
      fireEvent.click(toggle());
      fireEvent.click(await inWindow().findByRole("button", { name: /bob/ }));

      // in the window's own document, for this chatroom
      const profile = inWindow().getByRole("dialog", { name: "bob's profile" });
      expect(
        screen.queryByRole("dialog", { name: "bob's profile" }),
      ).toBeNull();
      await waitFor(() =>
        expect(
          within(profile).getByText(
            new Date("2026-03-04T00:00:00.000Z").toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          ),
        ).toBeInTheDocument(),
      );
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/members\/c1\/u2$/),
        expect.anything(),
      );
      // alice owns the chatroom, so she can kick bob from here too
      expect(
        within(profile).getByRole("button", { name: /Kick from chatroom/ }),
      ).toBeInTheDocument();

      // a click elsewhere in the window closes it
      fireEvent.mouseDown(chatWindowDoc().body);
      expect(inWindow().queryByRole("dialog")).toBeNull();
    });

    it("closes from its own button, which a narrow window needs", async () => {
      renderApp();
      await act(() => openChatWindow("c1"));
      fireEvent.click(toggle());
      fireEvent.click(
        inWindow().getByRole("button", { name: "Close members list" }),
      );
      expect(inWindow().queryByRole("complementary")).toBeNull();
      expect(toggle()).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps statuses and members up to date live", async () => {
      // the app's own client, which live updates change
      queryClient.clear();
      renderApp(queryClient);
      await act(() => openChatWindow("c1"));
      fireEvent.click(toggle());
      const panel = inWindow().getByRole("complementary");
      await within(panel).findByText("bob");

      act(() =>
        handleStatusUpdate({
          type: "status-update",
          chatroomId: "c1",
          member: member("u2", "bob", "ONLINE") as never,
        }),
      );
      // the cache tells the panel on the next tick
      await waitFor(() =>
        expect(
          within(
            within(panel).getByRole("region", { name: "Online" }),
          ).getByText("bob"),
        ).toBeInTheDocument(),
      );

      act(() => {
        handleUpdateMembers({
          type: "update-members",
          action: "JOIN",
          chatroomId: "c1",
          member: member("u4", "dave", "ONLINE") as never,
        });
        handleUpdateMembers({
          type: "update-members",
          action: "LEAVE",
          chatroomId: "c1",
          memberId: "u3",
        });
      });
      await waitFor(() =>
        expect(within(panel).getByText("dave")).toBeInTheDocument(),
      );
      expect(within(panel).queryByText("carol")).toBeNull();
    });
  });

  it("only lets the open tab be closed, so switching can't close one", async () => {
    renderApp();
    await act(() => openChatWindow("c1"));
    await act(() => openChatWindow("c2"));

    const closeButtons = (title: string) =>
      inWindow()
        .queryAllByRole("button", { name: `Close ${title}` })
        .filter((b) => b.closest(".tab"));
    expect(closeButtons("Design")).toHaveLength(1);
    expect(closeButtons("Standup")).toHaveLength(0);

    fireEvent.click(inWindow().getByRole("tab", { name: "Standup" }));
    expect(closeButtons("Standup")).toHaveLength(1);
    expect(closeButtons("Design")).toHaveLength(0);
  });

  it("moves a chat back to the page", async () => {
    renderApp();
    await act(() => openChatWindow("c1"));

    fireEvent.click(
      inWindow().getByRole("button", {
        name: "Move Standup back to the page",
      }),
    );

    expect(
      screen.getByRole("region", { name: "Standup chat" }),
    ).toBeInTheDocument();
    // nothing left in it, so the window closes
    expect(usePopoutStore.getState().chatWindow).toBeNull();
  });

  it("forgets its chats when the window is closed", async () => {
    renderApp();
    await act(() => openChatWindow("c1"));

    act(() => {
      chatWindowDoc().defaultView!.dispatchEvent(new Event("pagehide"));
    });

    expect(usePopoutStore.getState()).toMatchObject({
      chatWindow: null,
      windowTabs: [],
      activeWindowTab: null,
    });
  });

  it("leaves the chat in the dock if the window can't open", async () => {
    requestWindow.mockRejectedValueOnce(new Error("needs a click"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    usePopoutStore.getState().open("c1");
    renderApp();

    expect(await openChatWindow("c1")).toBe(false);
    expect(usePopoutStore.getState().popouts).toEqual([
      { chatroomId: "c1", minimized: false },
    ]);
  });
});
