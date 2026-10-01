import { fireEvent, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatMessage from "../../src/components/chat/ChatMessage";
import MessageInput from "../../src/components/chat/MessageInput";
import { useAuthStore, useMembersStore } from "../../src/hooks/useStores";
import { useMessagesStore } from "../../src/hooks/useStores";
import type { ChatroomMember } from "../../src/types/REST-types/ChatroomMember";
import type { Message } from "../../src/types/REST-types/Message";
import {
  emojiForShortcode,
  searchEmojis,
  shortcodeForEmoji,
  splitEmojis,
} from "../../src/utils/emoji";
import { setReaction } from "../../src/utils/messageChanges";
import { applyMessageReactions } from "../../src/ws-router/ws-routes/message-changes";
import { renderWithProviders } from "../renderWithProviders";

vi.mock("../../src/ws-router/ws", () => ({ sendWSMessage: vi.fn() }));
vi.mock("../../src/utils/messageChanges", () => ({
  setReaction: vi.fn(() => Promise.resolve()),
}));

const props = {
  id: "m1",
  content: "hello",
  sender: { id: "u2", username: "bob" },
  timestamp: new Date(2025, 0, 15, 14, 30),
};

// not in jsdom; the picker uses it to stay placed as it loads
window.ResizeObserver ??= class {
  observe() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: { userId: "me", username: "me", token: "t", isGuest: false },
  });
  useMembersStore.setState({
    members: [
      { memberId: "u2", member: { username: "bob" } },
    ] as unknown as ChatroomMember[],
  });
});

describe("message reactions", () => {
  const reactions = [
    { emoji: "👍", userId: "u2" },
    { emoji: "🎉", userId: "me" },
    { emoji: "👍", userId: "me" },
    { emoji: "👍", userId: "stranger" },
  ];

  it("shows each emoji once, with its count, in the order first used", () => {
    renderWithProviders(
      <ChatMessage {...props} reactions={reactions} canReact />,
    );
    const chips = screen.getAllByRole("button", { name: /reacted by/ });
    expect(chips.map((chip) => chip.textContent)).toEqual(["👍3", "🎉1"]);
    expect(chips[0]).toHaveAccessibleName("👍 reacted by bob, you, 1 other");
  });

  it("shows each emoji's shortcode on hover", async () => {
    renderWithProviders(
      <ChatMessage {...props} reactions={reactions} canReact />,
    );
    const chip = screen.getByRole("button", { name: /^👍 reacted/ });
    expect(chip).toHaveAttribute("title", "👍 reacted by bob, you, 1 other");

    fireEvent.mouseEnter(chip.parentElement!);
    await waitFor(() =>
      expect(chip).toHaveAttribute(
        "title",
        ":+1: reacted by bob, you, 1 other",
      ),
    );
    expect(screen.getByRole("button", { name: /^🎉 reacted/ })).toHaveAttribute(
      "title",
      ":tada: reacted by you",
    );
  });

  it("toggles your own reaction when an emoji is clicked", async () => {
    renderWithProviders(
      <ChatMessage
        {...props}
        reactions={[...reactions, { emoji: "❤️", userId: "u2" }]}
        canReact
      />,
    );
    const chip = (emoji: string) =>
      screen.getByRole("button", { name: new RegExp(`^${emoji} reacted`) });

    expect(chip("🎉")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip("🎉"));
    expect(setReaction).toHaveBeenLastCalledWith("m1", "🎉", false);
    // wait for the change to finish before the next
    await waitFor(() => expect(chip("❤️")).toBeEnabled());

    expect(chip("❤️")).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip("❤️"));
    expect(setReaction).toHaveBeenLastCalledWith("m1", "❤️", true);
  });

  it("can't be changed by someone who can't react", () => {
    renderWithProviders(<ChatMessage {...props} reactions={reactions} />);
    expect(screen.getByRole("button", { name: /^👍 reacted/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add a reaction" })).toBeNull();
  });

  it("opens an emoji picker from the toolbar, closed by Escape", async () => {
    renderWithProviders(<ChatMessage {...props} canReact />);
    const [toolbarButton] = screen.getAllByRole("button", {
      name: "Add a reaction",
    });
    fireEvent.click(toolbarButton);
    expect(
      screen.getByRole("dialog", { name: "Choose an emoji" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("updates a showing message's reactions", () => {
    const message = {
      id: "m1",
      chatroomId: "c1",
      reactions: [],
    } as unknown as Message;
    useMessagesStore.setState({ messages: [message] });

    applyMessageReactions("c1", "m1", [{ emoji: "🔥", userId: "u2" }]);

    expect(useMessagesStore.getState().messages[0].reactions).toEqual([
      { emoji: "🔥", userId: "u2" },
    ]);
  });
});

describe("emojis in message text", () => {
  it("splits text into its emojis, keeping sequences whole", () => {
    expect(splitEmojis("plain text")).toEqual([
      { text: "plain text", emoji: false },
    ]);
    expect(splitEmojis("hi 👋🏽 from 🇨🇦 👩‍💻!")).toEqual([
      { text: "hi ", emoji: false },
      { text: "👋🏽", emoji: true },
      { text: " from ", emoji: false },
      { text: "🇨🇦", emoji: true },
      { text: " ", emoji: false },
      { text: "👩‍💻", emoji: true },
      { text: "!", emoji: false },
    ]);
    expect(splitEmojis("café 1️⃣")).toEqual([
      { text: "café ", emoji: false },
      { text: "1️⃣", emoji: true },
    ]);
  });

  it("shows an emoji's shortcode when it's hovered", async () => {
    renderWithProviders(<ChatMessage {...props} content="nice 🔥 work" />);
    const emoji = screen.getByText("🔥");
    expect(emoji.closest("p")).toHaveTextContent("nice 🔥 work");

    fireEvent.mouseEnter(emoji);
    await waitFor(() => expect(emoji).toHaveAttribute("title", ":fire:"));
  });
});

describe("emoji search", () => {
  it("finds emojis by name and shortcode", async () => {
    const found = await searchEmojis("thumbsup");
    expect(found[0]).toMatchObject({ id: "+1", native: "👍" });
    expect((await emojiForShortcode("joy"))?.native).toBe("😂");
    expect((await emojiForShortcode("thumbsup"))?.native).toBe("👍");
    expect(await emojiForShortcode("not_an_emoji")).toBeNull();
    expect(await shortcodeForEmoji("👍")).toBe(":+1:");
    expect(await shortcodeForEmoji("👍🏽")).toBe(":+1::skin-tone-4:");
    expect(await shortcodeForEmoji("hi")).toBeNull();
  });
});

describe("emoji shortcodes in the message box", () => {
  const setup = () => {
    const ref = createRef<HTMLTextAreaElement>();
    const handleSubmit = vi.fn();
    renderWithProviders(
      <Routes>
        <Route
          path="/chat/:chatroomId"
          element={
            <MessageInput handleSubmit={handleSubmit} messageInputRef={ref} />
          }
        />
      </Routes>,
      { route: "/chat/room1" },
    );
    const textarea = screen.getByPlaceholderText(
      "Message...",
    ) as HTMLTextAreaElement;
    const type = (value: string) =>
      fireEvent.input(textarea, { target: { value } });
    return { textarea, type, handleSubmit };
  };

  it("suggests emojis for a shortcode, picked with Enter", async () => {
    const { textarea, type, handleSubmit } = setup();
    type("nice :thumbsu");

    const option = await screen.findByRole("option", { selected: true });
    expect(option).toHaveTextContent("👍:+1:");

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(textarea.value).toBe("nice 👍");
    // Enter picked the emoji rather than sending the message
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("moves through suggestions with the arrow keys and closes on Escape", async () => {
    const { textarea, type } = setup();
    type(":smil");
    await screen.findByRole("listbox");
    const first = screen.getByRole("option", { selected: true });

    fireEvent.keyDown(textarea, { key: "ArrowDown" });
    expect(screen.getByRole("option", { selected: true })).not.toBe(first);

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(textarea.value).toBe(":smil");
  });

  it("turns a finished shortcode into its emoji", async () => {
    const { textarea, type } = setup();
    type("so funny :joy:");
    await waitFor(() => expect(textarea.value).toBe("so funny 😂"));
  });

  it("leaves times and words with colons alone", async () => {
    const { textarea, type } = setup();
    type("meet at 10:30:");
    type("note:smile:");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(textarea.value).toBe("note:smile:");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
