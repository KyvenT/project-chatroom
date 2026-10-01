import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/services/authService.js", () => ({
  REFRESH_TOKEN_EXPIRATION: 7 * 24 * 60 * 60 * 1000,
  INVALID_LOGIN: "Invalid username or password",
  loginUser: vi.fn(),
  useRefreshToken: vi.fn(),
}));

import * as authService from "../../src/services/authService.js";
import {
  authenticateUser,
  useRefreshToken,
} from "../../src/controllers/authController.js";

const makeRes = () => {
  const res: any = { header: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.header.mockReturnValue(res);
  return res;
};

describe("auth cookies and errors", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sets a strict, http-only refresh cookie lasting 7 days", async () => {
    vi.mocked(authService.loginUser).mockResolvedValue({
      refreshToken: "rt",
      token: "at",
      userId: "u1",
      username: "alice",
      isGuest: false,
    });
    const res = makeRes();
    await authenticateUser({ data: {} } as Request, res as Response);

    const cookie = res.header.mock.calls[0][1];
    expect(cookie).toContain("refreshToken=rt");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    // in seconds, not milliseconds
    expect(cookie).toContain(`Max-Age=${7 * 24 * 60 * 60}`);
    expect(cookie).not.toContain("Secure");
    expect(res.json.mock.calls[0][0]).not.toHaveProperty("refreshToken");
  });

  it("marks the cookie Secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = makeRes();
    await authenticateUser({ data: {} } as Request, res as Response);
    expect(res.header.mock.calls[0][1]).toContain("Secure");
  });

  it("answers failed logins with 401 and one message", async () => {
    vi.mocked(authService.loginUser).mockRejectedValue(
      new Error("Invalid username or password"),
    );
    const res = makeRes();
    await authenticateUser({ data: {} } as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid username or password",
    });
  });

  it("doesn't reveal why a refresh failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(authService.useRefreshToken).mockRejectedValue(
      new Error("Invalid `prisma.session.findUnique()` invocation"),
    );
    const res = makeRes();
    await useRefreshToken(
      { cookies: { refreshToken: "rt" } } as unknown as Request,
      res as Response,
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid refresh token" });
  });
});
