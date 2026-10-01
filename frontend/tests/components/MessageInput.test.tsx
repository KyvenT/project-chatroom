import { fireEvent, screen } from "@testing-library/react";
import { createRef } from "react";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MessageInput from "../../src/components/chat/MessageInput";
import { sendWSMessage } from "../../src/ws-router/ws";
import { renderWithProviders } from "../renderWithProviders";

vi.mock("../../src/ws-router/ws", () => ({ sendWSMessage: vi.fn() }));

const setup = (handleSubmit = vi.fn()) => {
  const ref = createRef<HTMLTextAreaElement>();
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
  return { handleSubmit, textarea: screen.getByPlaceholderText("Message...") };
};

describe("MessageInput", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits on Enter when there is text", () => {
    const { handleSubmit, textarea } = setup();
    fireEvent.change(textarea, { target: { value: "hi" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(handleSubmit).toHaveBeenCalledOnce();
  });

  it("does not submit an empty message", () => {
    const { handleSubmit, textarea } = setup();
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("does not submit on Shift+Enter and grows the textarea", () => {
    const { handleSubmit, textarea } = setup();
    fireEvent.change(textarea, { target: { value: "hi" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveAttribute("rows", "2");
  });

  it("sends a typing presence message once per typing burst", () => {
    const { textarea } = setup();
    fireEvent.keyDown(textarea, { key: "a" });
    fireEvent.keyDown(textarea, { key: "b" });
    expect(sendWSMessage).toHaveBeenCalledTimes(1);
    expect(sendWSMessage).toHaveBeenCalledWith({
      type: "typing-presence",
      chatroomId: "room1",
    });
  });

  it("renders an accessible send button", () => {
    setup();
    expect(
      screen.getByRole("button", { name: "Send message" }),
    ).toBeInTheDocument();
  });

  it("stops at the server's length limit and counts down near it", () => {
    const { textarea } = setup();
    expect(textarea).toHaveAttribute("maxLength", "60");
    expect(screen.queryByLabelText(/characters left/)).toBeNull();

    fireEvent.input(textarea, { target: { value: "x".repeat(50) } });
    expect(screen.getByLabelText("10 characters left")).toBeInTheDocument();
  });

  it("clears the countdown after sending", () => {
    const { textarea } = setup();
    fireEvent.input(textarea, { target: { value: "x".repeat(50) } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(screen.queryByLabelText(/characters left/)).toBeNull();
  });
});

describe("MessageInput attachments", () => {
  it("refuses file types the server won't take without uploading", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setup();

    const input = screen.getByTestId("attach-input");
    fireEvent.change(input, {
      target: {
        files: [new File(["<svg/>"], "x.svg", { type: "image/svg+xml" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That file type can't be sent",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
