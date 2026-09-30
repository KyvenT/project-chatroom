import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountProfilePage } from "../../src/router/routes/utility/AccountProfile";
import { useAvatarStore } from "../../src/hooks/useAvatarStore";
import { useAuthStore } from "../../src/hooks/useStores";
import {
  prepareAvatar,
  removeAvatar,
  uploadAvatar,
} from "../../src/utils/avatars";
import { renderWithProviders } from "../renderWithProviders";

vi.mock("../../src/utils/avatars", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/avatars")>()),
  prepareAvatar: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
}));

const details = (avatarUpdatedAt: string | null) => ({
  id: "u1",
  email: null,
  username: "alice",
  status: "ONLINE",
  createdAt: new Date(0).toISOString(),
  isGuest: false,
  avatarUpdatedAt,
});

const render = (isGuest = false, avatarUpdatedAt: string | null = null) => {
  useAuthStore.setState({
    user: { userId: "u1", username: "alice", token: "tok", isGuest },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(details(avatarUpdatedAt)), { status: 200 }),
      ),
    ),
  );
  return renderWithProviders(
    <QueryClientProvider client={new QueryClient()}>
      <AccountProfilePage />
    </QueryClientProvider>,
  );
};

describe("profile picture on the account page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAvatarStore.setState({ versions: {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shrinks and uploads a picked picture", async () => {
    const prepared = new Blob(["x"], { type: "image/webp" });
    vi.mocked(prepareAvatar).mockResolvedValue(prepared);
    render();

    const add = await screen.findByRole("button", { name: "Add picture" });
    await waitFor(() => expect(add).toBeEnabled());

    const file = new File(["img"], "me.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-input"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(uploadAvatar).toHaveBeenCalledWith("u1", prepared),
    );
    expect(prepareAvatar).toHaveBeenCalledWith(file);
  });

  it("shows why a picture couldn't be used", async () => {
    vi.mocked(prepareAvatar).mockRejectedValue(
      new Error("That image couldn't be read"),
    );
    render();
    await screen.findByRole("button", { name: "Add picture" });

    fireEvent.change(screen.getByTestId("avatar-input"), {
      target: { files: [new File(["x"], "x.png", { type: "image/png" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That image couldn't be read",
    );
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it("offers to change or remove an existing picture", async () => {
    render(false, "2026-10-01T12:00:00.000Z");
    expect(
      await screen.findByRole("button", { name: "Change picture" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(removeAvatar).toHaveBeenCalledWith("u1"));
  });

  it("asks guests to sign up", () => {
    render(true);
    expect(
      screen.getByText("Sign up for an account to add a profile picture."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add picture" })).toBeNull();
  });
});
