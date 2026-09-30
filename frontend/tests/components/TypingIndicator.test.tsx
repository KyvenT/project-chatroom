import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { TypingIndicator } from "../../src/components/chat/TypingIndicator";
import { useTypingPresenceStore } from "../../src/hooks/useStores";
import { renderWithProviders } from "../renderWithProviders";

const typing = (...names: string[]) =>
  act(() =>
    names.forEach((name) =>
      useTypingPresenceStore
        .getState()
        .addTypingPresence({ userId: name, username: name, chatroomId: "c1" }),
    ),
  );

describe("TypingIndicator", () => {
  beforeEach(() => useTypingPresenceStore.setState({ typingUsers: [] }));

  it.each([
    [["ann"], "ann is typing…"],
    [["ann", "bo"], "ann and bo are typing…"],
    [["ann", "bo", "cy"], "ann, bo and cy are typing…"],
    [["ann", "bo", "cy", "di"], "Several people are typing…"],
  ])("describes %j", (names, text) => {
    renderWithProviders(<TypingIndicator chatroomId="c1" />);
    typing(...names);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("only shows the given chatroom", () => {
    renderWithProviders(<TypingIndicator chatroomId="c2" />);
    typing("ann");
    expect(screen.queryByText(/typing/)).toBeNull();
  });
});
