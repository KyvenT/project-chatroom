import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ws-router/ws", () => ({ sendWSMessage: vi.fn() }));

import { sendWSMessage } from "../../src/ws-router/ws";
import { PopoutDock } from "../../src/components/popout/PopoutDock";
import { PopoutButton } from "../../src/components/popout/PopoutButton";
import { usePopoutStore, MAX_POPOUTS } from "../../src/hooks/usePopoutStore";
import { useAuthStore, useChatroomsStore } from "../../src/hooks/useStores";
import { handleChatMessage } from "../../src/ws-router/ws-routes/chat-message";
import type { Chatroom } from "../../src/types/REST-types/Chatroom";
import type { Message } from "../../src/types/REST-types/Message";
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

const makeMessage = (id: string, chatroomId: string, content: string) =>
  ({
    id,
    chatroomId,
    content,
    senderUserId: "u2",
    senderUser: { id: "u2", username: "bob" },
    createdAt: new Date() as unknown as Date,
    editedAt: null,
  }) as Message;

const sent = () => vi.mocked(sendWSMessage).mock.calls.map(([m]) => m);

describe("chat pop-outs", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(sendWSMessage).mockClear();
    usePopoutStore.setState({ popouts: [], liveMessages: {} });
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    useChatroomsStore
      .getState()
      .setChatroomList([
        makeChatroom("c1", "Standup", 2),
        makeChatroom("c2", "Design"),
        makeChatroom("c3", "Games"),
        makeChatroom("c4", "Music"),
      ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse([makeMessage("old", "c1", "Earlier message")])),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const renderDock = () =>
    renderWithProviders(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <PopoutButton chatroomId="c1" title="Standup" />
        <PopoutDock />
      </QueryClientProvider>,
    );

  describe("store", () => {
    it("keeps at most a few pop-outs, dropping the oldest", () => {
      const { open } = usePopoutStore.getState();
      ["c1", "c2", "c3", "c4"].forEach(open);

      expect(
        usePopoutStore.getState().popouts.map((p) => p.chatroomId),
      ).toEqual(["c2", "c3", "c4"].slice(-MAX_POPOUTS));
    });

    it("brings an open pop-out to the front and expands it", () => {
      const { open, setMinimized } = usePopoutStore.getState();
      open("c1");
      open("c2");
      setMinimized("c1", true);
      open("c1");

      expect(usePopoutStore.getState().popouts).toEqual([
        { chatroomId: "c2", minimized: false },
        { chatroomId: "c1", minimized: false },
      ]);
    });

    it("remembers pop-outs in the browser", () => {
      usePopoutStore.getState().open("c1");
      expect(JSON.parse(localStorage.getItem("chatPopouts")!)).toEqual([
        { chatroomId: "c1", minimized: false },
      ]);
    });

    it("only collects live messages for expanded pop-outs", () => {
      const { open, setMinimized, addLiveMessage } = usePopoutStore.getState();
      open("c1");
      open("c2");
      setMinimized("c2", true);

      addLiveMessage(makeMessage("m1", "c1", "hi"));
      addLiveMessage(makeMessage("m1", "c1", "hi"));
      addLiveMessage(makeMessage("m2", "c2", "hey"));
      addLiveMessage(makeMessage("m3", "c9", "not open"));

      expect(usePopoutStore.getState().liveMessages).toEqual({
        c1: [expect.objectContaining({ id: "m1" })],
      });
    });
  });

  describe("dock", () => {
    it("opens a pop-out with the chatroom's history", async () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));

      const popout = screen.getByRole("region", { name: "Standup chat" });
      expect(await within(popout).findByText("Earlier message")).toBeVisible();
    });

    it("watches expanded pop-outs and marks them read", () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));

      expect(sent()).toContainEqual({
        type: "update-watched-chatrooms",
        chatroomIds: ["c1"],
      });
      expect(sent()).toContainEqual({
        type: "update-last-viewed-at",
        chatroomId: "c1",
      });
      expect(useChatroomsStore.getState().chatrooms[0].unreadMessages).toBe(0);
    });

    it("stops watching a pop-out when it's minimized", () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));
      vi.mocked(sendWSMessage).mockClear();

      fireEvent.click(screen.getByRole("button", { name: "Minimize Standup" }));

      expect(sent()).toContainEqual({
        type: "update-watched-chatrooms",
        chatroomIds: [],
      });
      expect(
        screen.queryByRole("textbox", { name: "Message Standup" }),
      ).toBeNull();
    });

    it("sends messages with Enter, adding lines with Shift+Enter", () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));
      const input = screen.getByRole("textbox", { name: "Message Standup" });

      fireEvent.change(input, { target: { value: "hello" } });
      fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
      expect(sent()).not.toContainEqual(
        expect.objectContaining({ type: "message" }),
      );

      fireEvent.keyDown(input, { key: "Enter" });
      expect(sent()).toContainEqual({
        type: "message",
        content: "hello",
        chatroomId: "c1",
      });
      expect(input).toHaveValue("");
    });

    it("sends with the send button, but not empty messages", () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));
      const send = screen.getByRole("button", { name: "Send message" });
      expect(send).toBeDisabled();

      fireEvent.change(
        screen.getByRole("textbox", { name: "Message Standup" }),
        {
          target: { value: "  hi  " },
        },
      );
      fireEvent.click(send);
      expect(sent()).toContainEqual({
        type: "message",
        content: "hi",
        chatroomId: "c1",
      });
    });

    it("shows new messages as they arrive", async () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));

      act(() =>
        handleChatMessage({
          type: "chat-message",
          message: makeMessage("m9", "c1", "Live one"),
        }),
      );

      expect(await screen.findByText("Live one")).toBeVisible();
    });

    it("closes a pop-out", () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Close Standup pop-out" }),
      );

      expect(screen.queryByRole("region", { name: "Standup chat" })).toBeNull();
    });

    it("hides pop-outs of chatrooms the user has left", () => {
      usePopoutStore.getState().open("gone");
      renderDock();
      expect(
        screen.queryByRole("region", { name: "Chat pop-outs" }),
      ).toBeNull();
    });

    it("tells others you're typing, at most once a second", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));
      const input = screen.getByRole("textbox", { name: "Message Standup" });
      const typing = () =>
        sent().filter((m) => m.type === "typing-presence").length;

      fireEvent.change(input, { target: { value: "h" } });
      fireEvent.change(input, { target: { value: "he" } });
      expect(typing()).toBe(1);

      vi.setSystemTime(Date.now() + 1500);
      fireEvent.change(input, { target: { value: "hel" } });
      expect(typing()).toBe(2);
      expect(sent()).toContainEqual({
        type: "typing-presence",
        chatroomId: "c1",
      });
      vi.useRealTimers();
    });

    it("counts down near the length limit", () => {
      renderDock();
      fireEvent.click(screen.getByRole("button", { name: "Pop out Standup" }));
      const input = screen.getByRole("textbox", { name: "Message Standup" });
      expect(input).toHaveAttribute("maxLength", "60");

      fireEvent.change(input, { target: { value: "x".repeat(55) } });
      expect(screen.getByLabelText("5 characters left")).toBeInTheDocument();
    });
  });
});
