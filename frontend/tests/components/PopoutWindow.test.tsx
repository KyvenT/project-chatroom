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

  const renderApp = () =>
    renderWithProviders(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
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
