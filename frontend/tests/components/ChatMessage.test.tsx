import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChatMessage from "../../src/components/chat/ChatMessage";
import { renderWithProviders } from "../renderWithProviders";

describe("ChatMessage", () => {
  const props = {
    id: "m1",
    content: "hello world",
    sender: { id: "u1", username: "alice" },
    timestamp: new Date(2025, 0, 15, 14, 30),
  };

  it("shows the sender, content and formatted timestamp", () => {
    renderWithProviders(<ChatMessage {...props} />);

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText(/2025\/1\/15/)).toBeInTheDocument();
    expect(screen.getByText(/2:30\s?PM/)).toBeInTheDocument();
  });

  it("shows messages from deleted accounts as from Deleted User", () => {
    renderWithProviders(<ChatMessage {...props} sender={null} />);

    expect(screen.getByText("Deleted User")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
    // there's no member to show details of
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("chained ChatMessage", () => {
  const props = {
    id: "m2",
    content: "and another thing",
    sender: { id: "u1", username: "alice" },
    timestamp: new Date(2025, 0, 15, 14, 31),
  };

  it("leaves out the name and time, keeping them for screen readers", () => {
    const { container } = renderWithProviders(
      <ChatMessage {...props} chained />,
    );

    expect(screen.getByText("and another thing")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "alice" })).toBeNull();
    expect(container.querySelector(".visuallyHidden")).toHaveTextContent(
      /alice, 2025\/1\/15 2:31\s?PM/,
    );
    // the time shown on hover
    expect(container.querySelector("time.chainTime")).toHaveTextContent(
      /2:31\s?PM/,
    );
  });

  it("marks an edit after the text", () => {
    renderWithProviders(
      <ChatMessage {...props} chained editedAt={new Date()} />,
    );
    expect(screen.getByText("(edited)").closest("p")).toHaveTextContent(
      "and another thing (edited)",
    );
  });
});

describe("ChatMessage pictures", () => {
  const props = {
    id: "m3",
    content: "hi",
    sender: { id: "u1", username: "alice" },
    timestamp: new Date(2025, 0, 15, 14, 31),
  };

  it("shows the sender's picture on a message's first line only", () => {
    const first = renderWithProviders(<ChatMessage {...props} />);
    expect(first.container.querySelector(".avatarSlot")).toHaveTextContent("A");
    first.unmount();

    const chained = renderWithProviders(<ChatMessage {...props} chained />);
    expect(chained.container.querySelector(".avatarSlot")).toBeNull();
    expect(chained.container.querySelector(".avatarGutter")).not.toBeNull();
  });
});
