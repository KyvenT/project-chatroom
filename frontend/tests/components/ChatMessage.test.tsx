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
});
