import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatHome from "../../src/router/routes/chat/ChatHome";
import { useAuthStore } from "../../src/hooks/useStores";
import { renderWithProviders } from "../renderWithProviders";

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const groups = [
  {
    id: "g1",
    userId: "u1",
    name: "Work",
    createdAt: new Date().toISOString(),
    chatrooms: [
      { chatroomId: "c1", chatroom: { title: "Standup" }, pinnedIndex: 1 },
    ],
  },
];

describe("ChatHome pinned groups", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "tok",
      isGuest: false,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        jsonResponse(url.includes("/api/pinned/me") ? groups : []),
      ),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const renderHome = () =>
    renderWithProviders(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ChatHome />
      </QueryClientProvider>,
    );

  it("collapses and expands a group from its header", async () => {
    renderHome();
    const toggle = await screen.findByRole("button", { name: /^Work/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Standup")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Standup")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Standup")).toBeInTheDocument();
  });

  it("remembers collapsed groups after a reload", async () => {
    const { unmount } = renderHome();
    fireEvent.click(await screen.findByRole("button", { name: /^Work/ }));
    unmount();

    renderHome();
    expect(
      await screen.findByRole("button", { name: /^Work/ }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Standup")).not.toBeInTheDocument();
  });
});
