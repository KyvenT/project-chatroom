import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAvatarStore } from "../../src/hooks/useAvatarStore";
import { useAuthStore } from "../../src/hooks/useStores";
import {
  prepareAvatar,
  removeAvatar,
  uploadAvatar,
} from "../../src/utils/avatars";

vi.mock("../../src/utils/refreshAccessToken", () => ({
  refreshAccessToken: vi.fn(),
}));

describe("avatar uploads", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    useAvatarStore.setState({ versions: {} });
    useAuthStore.setState({
      user: { userId: "u1", username: "alice", token: "tok", isGuest: false },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("sends the picture with its type and shows the new one right away", async () => {
    const when = "2026-10-01T12:00:00.000Z";
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ avatarUpdatedAt: when }), { status: 200 }),
    );
    const picture = new Blob(["x"], { type: "image/webp" });
    await uploadAvatar("u1", picture);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/users/me/avatar");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(picture);
    expect(init.headers.get("Content-Type")).toBe("image/webp");
    expect(useAvatarStore.getState().versions.u1).toBe(when);
  });

  it("removes the picture", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ avatarUpdatedAt: null }), { status: 200 }),
    );
    await removeAvatar("u1");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(useAvatarStore.getState().versions.u1).toBeNull();
  });

  it("passes on the server's reason for refusing a picture", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Only users can add a profile picture" }),
        {
          status: 403,
        },
      ),
    );
    await expect(
      uploadAvatar("u1", new Blob(["x"], { type: "image/png" })),
    ).rejects.toThrow("Only users can add a profile picture");
  });
});

describe("prepareAvatar", () => {
  it("refuses files that aren't supported images", async () => {
    await expect(
      prepareAvatar(new File(["<svg/>"], "x.svg", { type: "image/svg+xml" })),
    ).rejects.toThrow(/PNG, JPEG, WebP or GIF/);
  });
});
