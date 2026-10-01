import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberInfo } from "../../src/components/chat/MemberInfoPopup";
import ProfileStatus from "../../src/components/chat/ProfileStatus";
import { useAuthStore, useMembersStore } from "../../src/hooks/useStores";
import type { ChatroomMember } from "../../src/types/REST-types/ChatroomMember";
import { renderWithProviders } from "../renderWithProviders";

const member = (
  memberId: string,
  username: string,
  role: ChatroomMember["role"] = "MEMBER",
): ChatroomMember => ({
  memberId,
  role,
  member: { username, status: "AWAY", avatarUpdatedAt: null },
});

const details = {
  joinedAt: "2026-03-04T00:00:00.000Z",
  member: {
    id: "u2",
    username: "bob",
    status: "AWAY",
    isGuest: true,
    createdAt: "2025-01-02T00:00:00.000Z",
  },
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(details), { status: 200 })),
  );
  vi.stubGlobal("fetch", fetchMock);
  useAuthStore.setState({
    user: { userId: "u1", username: "alice", token: "tok", isGuest: false },
  });
});
afterEach(() => vi.unstubAllGlobals());

const renderPopup = (clicked: ChatroomMember, onClose = vi.fn()) => {
  const button = document.createElement("button");
  document.body.append(button);
  renderWithProviders(
    <QueryClientProvider client={new QueryClient()}>
      <Routes>
        <Route
          path="/chat/:chatroomId"
          element={
            <MemberInfo
              clickedMember={{ member: clicked, button }}
              onClose={onClose}
            />
          }
        />
      </Routes>
    </QueryClientProvider>,
    { route: "/chat/c1" },
  );
  return { onClose, button };
};

describe("member profile popup", () => {
  it("shows who they are, their role and when they joined", async () => {
    useMembersStore.setState({
      members: [member("u1", "alice"), member("u2", "bob", "OWNER")],
    });
    renderPopup(member("u2", "bob", "OWNER"));

    const popup = screen.getByRole("dialog", { name: "bob's profile" });
    expect(popup).toHaveTextContent("bob");
    expect(popup).toHaveTextContent("Owner");
    expect(popup).toHaveTextContent("Away");
    expect(await screen.findByText("Guest")).toBeInTheDocument();
    expect(popup).toHaveTextContent(/Joined this chatroom/);
    expect(popup).toHaveTextContent(/Member since/);
  });

  it("marks you and hides the kick button from plain members", () => {
    useMembersStore.setState({ members: [member("u1", "alice")] });
    renderPopup(member("u1", "alice"));
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kick/ })).toBeNull();
  });

  it("lets the owner kick a member", async () => {
    useMembersStore.setState({
      members: [member("u1", "alice", "OWNER"), member("u2", "bob")],
    });
    const { onClose } = renderPopup(member("u2", "bob"));

    fireEvent.click(screen.getByRole("button", { name: "Kick from chatroom" }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            url.endsWith("/api/members/c1") && init?.method === "DELETE",
        ),
      ).toBe(true),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("takes focus and closes on Escape", () => {
    useMembersStore.setState({ members: [member("u1", "alice")] });
    const { onClose } = renderPopup(member("u2", "bob"));

    const popup = screen.getByRole("dialog");
    expect(popup).toHaveFocus();
    fireEvent.keyDown(popup, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("status picker", () => {
  it("shows the current status by name and changes it", () => {
    useMembersStore.setState({ members: [member("u1", "alice")] });
    renderWithProviders(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileStatus status="AWAY" />
      </QueryClientProvider>,
    );

    const picker = screen.getByRole("combobox", { name: "Your status" });
    expect(picker).toHaveValue("AWAY");
    expect(screen.getByRole("option", { name: "Away" })).toBeInTheDocument();

    fireEvent.change(picker, { target: { value: "ONLINE" } });
    expect(useMembersStore.getState().members[0].member).toMatchObject({
      status: "ONLINE",
      username: "alice",
      avatarUpdatedAt: null,
    });
  });
});
