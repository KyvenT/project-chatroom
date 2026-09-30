import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { securityHeaders } from "../../src/middleware/securityHeaders.js";
import { hideServerErrors } from "../../src/middleware/hideServerErrors.js";

const makeRes = () => {
  const headers: Record<string, string> = {};
  const res: any = {
    statusCode: 200,
    setHeader: (k: string, v: string) => (headers[k] = v),
    removeHeader: vi.fn(),
    json: vi.fn(),
  };
  return { res, headers };
};

describe("securityHeaders", () => {
  it("sets a strict content security policy and anti-framing headers", () => {
    const { res, headers } = makeRes();
    const next = vi.fn();
    securityHeaders({} as Request, res as Response, next);

    expect(headers["Content-Security-Policy"]).toContain("script-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(next).toHaveBeenCalled();
  });
});

describe("hideServerErrors", () => {
  const send = (status: number, body: unknown) => {
    const { res } = makeRes();
    const original = res.json;
    hideServerErrors({} as Request, res as Response, vi.fn());
    res.statusCode = status;
    res.json(body);
    return original.mock.calls[0][0];
  };

  it("replaces database error details in server errors", () => {
    expect(
      send(500, {
        message: "Invalid `prisma.user.update()` invocation:\nRecord not found",
      }),
    ).toEqual({ message: "Something went wrong" });
  });

  it("keeps our own error messages and non-server errors", () => {
    expect(send(500, { message: "Failed to create user" })).toEqual({
      message: "Failed to create user",
    });
    expect(send(400, { message: "prisma stuff\nhere" })).toEqual({
      message: "prisma stuff\nhere",
    });
  });
});

describe("auth rate limit", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.useRealTimers());

  it("allows 10 auth requests per IP per 15 minutes", async () => {
    const { authRateLimitMiddleware } =
      await import("../../src/middleware/rateLimitMiddleware.js");
    const call = (ip: string) => {
      const res: any = { status: vi.fn(() => res), json: vi.fn() };
      const next = vi.fn();
      authRateLimitMiddleware({ ip } as Request, res, next);
      return { res, next };
    };

    for (let i = 0; i < 10; i++) expect(call("1.2.3.4").next).toBeCalled();
    const blocked = call("1.2.3.4");
    expect(blocked.next).not.toBeCalled();
    expect(blocked.res.status).toHaveBeenCalledWith(429);
    expect(call("5.6.7.8").next).toBeCalled();
  });
});
