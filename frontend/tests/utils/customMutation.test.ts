import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customMutation } from "../../src/utils/customMutation";
import { useAuthStore } from "../../src/hooks/useStores";

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

const refreshed = {
  userId: "u1",
  username: "alice",
  token: "new-token",
  isGuest: false,
};

describe("customMutation", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useAuthStore.getState().handleSignIn({
      userId: "u1",
      username: "alice",
      token: "old-token",
      isGuest: false,
    });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const request = {
    fetchUrl: "/api/pinned/c1/pin",
    method: "PATCH" as const,
    reqBody: { pin: true, pinGroupId: "g1" },
  };

  it("retries an expired-token request with its method, body and new token", async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse({ message: "expired" }, false, 401))
      .mockReturnValueOnce(jsonResponse(refreshed))
      .mockReturnValueOnce(jsonResponse({ message: "chatroom pin updated" }));

    await expect(customMutation(request)).resolves.toEqual({
      message: "chatroom pin updated",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [url, init] = fetchMock.mock.calls[2];
    expect(url).toBe("/api/pinned/c1/pin");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify(request.reqBody));
    expect(init.headers.get("authorization")).toBe("Bearer new-token");
  });

  it("throws when the retried request fails", async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse({ message: "expired" }, false, 401))
      .mockReturnValueOnce(jsonResponse(refreshed))
      .mockReturnValueOnce(jsonResponse({ message: "Forbidden" }, false, 403));

    await expect(customMutation(request)).rejects.toThrow("Forbidden");
  });

  it("throws Unauthorized when the token can't be refreshed", async () => {
    fetchMock
      .mockReturnValueOnce(jsonResponse({ message: "expired" }, false, 401))
      .mockReturnValueOnce(jsonResponse({ message: "no session" }, false, 401));

    await expect(customMutation(request)).rejects.toThrow("Unauthorized");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
