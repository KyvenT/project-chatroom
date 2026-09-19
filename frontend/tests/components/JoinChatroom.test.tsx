import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../src/hooks/useStores";
import JoinChatroom from "../../src/router/routes/join/JoinChatroom";
import { renderWithProviders } from "../renderWithProviders";

const Location = () => <p data-testid="location">{useLocation().pathname}</p>;

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

const renderJoin = (joinKey = "abcDEF123_-xyz09") =>
  renderWithProviders(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Routes>
        <Route path="/join/:joinKey" element={<JoinChatroom />} />
        <Route path="/chat/:chatroomId" element={<Location />} />
      </Routes>
    </QueryClientProvider>,
    { route: `/join/${joinKey}` },
  );

const signIn = (isGuest = false) =>
  useAuthStore.getState().handleSignIn({
    userId: "u1",
    username: "alice",
    token: "tok",
    isGuest,
  });

describe("JoinChatroom", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useAuthStore.getState().handleLogOut();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("looks the chatroom up by join key", async () => {
    fetchMock.mockReturnValue(
      jsonResponse({ chatroomId: "c1", title: "Room", privacy: "JOINABLE" }),
    );
    renderJoin();

    await screen.findByText(/Join "Room"/);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/chatroomsPublic/join/abcDEF123_-xyz09",
    );
  });

  it("shows an error for an invalid or replaced link", async () => {
    fetchMock.mockReturnValue(
      jsonResponse({ message: "Invalid or expired join link" }, false, 404),
    );
    renderJoin();

    expect(await screen.findByText("Link not valid")).toBeInTheDocument();
  });

  it("joins as a signed-in user and navigates to the chatroom", async () => {
    signIn();
    fetchMock
      .mockReturnValueOnce(
        jsonResponse({ chatroomId: "c1", title: "Room", privacy: "JOINABLE" }),
      )
      .mockReturnValueOnce(
        jsonResponse({ message: "Chatroom joined", chatroomId: "c1" }),
      );
    renderJoin();

    fireEvent.click(
      await screen.findByRole("button", { name: "Join chatroom" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/chat/c1"),
    );
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toContain("/api/members/join");
    expect(JSON.parse(init.body)).toEqual({ joinKey: "abcDEF123_-xyz09" });
  });

  it("says invite-only chatrooms need an invite", async () => {
    signIn();
    fetchMock.mockReturnValue(
      jsonResponse({ chatroomId: "c1", title: "Room", privacy: "INVITE_ONLY" }),
    );
    renderJoin();

    expect(
      await screen.findByText(/can only be joined with an invite/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Join chatroom" }),
    ).not.toBeInTheDocument();
  });

  it("offers guest access on PUBLIC chatrooms when signed out", async () => {
    fetchMock.mockReturnValue(
      jsonResponse({ chatroomId: "c1", title: "Room", privacy: "PUBLIC" }),
    );
    renderJoin();

    expect(await screen.findByText("Sign in to join")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Guest username..."),
    ).toBeInTheDocument();
  });

  it("does not offer guest access on JOINABLE chatrooms", async () => {
    fetchMock.mockReturnValue(
      jsonResponse({ chatroomId: "c1", title: "Room", privacy: "JOINABLE" }),
    );
    renderJoin();

    await screen.findByText("Sign in to join");
    expect(
      screen.queryByPlaceholderText("Guest username..."),
    ).not.toBeInTheDocument();
  });

  it("creates a guest with the join key and opens the chatroom", async () => {
    fetchMock
      .mockReturnValueOnce(
        jsonResponse({ chatroomId: "c1", title: "Room", privacy: "PUBLIC" }),
      )
      .mockReturnValueOnce(
        jsonResponse({
          userId: "g1",
          username: "visitor",
          token: "gtok",
          isGuest: true,
        }),
      );
    renderJoin();

    fireEvent.change(await screen.findByPlaceholderText("Guest username..."), {
      target: { value: "visitor" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join as guest" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/chat/c1"),
    );
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toContain("/api/auth/create-guest");
    expect(JSON.parse(init.body)).toEqual({
      username: "visitor",
      joinKey: "abcDEF123_-xyz09",
    });
    expect(useAuthStore.getState().user.token).toBe("gtok");
  });
});
