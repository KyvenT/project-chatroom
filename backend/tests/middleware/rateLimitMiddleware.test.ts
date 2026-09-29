import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rateLimit,
  rateLimitMiddleware,
  type RateLimitWindowCount,
} from "../../src/middleware/rateLimitMiddleware.js";

describe("rateLimit", () => {
  let requests: Map<string, RateLimitWindowCount>;

  beforeEach(() => {
    requests = new Map();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it("allows requests up to the limit then blocks", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("ip", requests, 3, 1000)).toEqual({ ok: true });
    }
    expect(rateLimit("ip", requests, 3, 1000)).toEqual({ ok: false });
  });

  it("tracks identifiers independently", () => {
    rateLimit("a", requests, 1, 1000);
    expect(rateLimit("a", requests, 1, 1000)).toEqual({ ok: false });
    expect(rateLimit("b", requests, 1, 1000)).toEqual({ ok: true });
  });

  it("starts a fresh window once the interval has passed", () => {
    rateLimit("ip", requests, 1, 1000);
    expect(rateLimit("ip", requests, 1, 1000)).toEqual({ ok: false });

    vi.advanceTimersByTime(1001);
    expect(rateLimit("ip", requests, 1, 1000)).toEqual({ ok: true });
    expect(requests.get("ip")?.count).toBe(1);
  });

  it("does not extend the window on subsequent requests", () => {
    rateLimit("ip", requests, 5, 1000);
    const { windowStart } = requests.get("ip")!;
    vi.advanceTimersByTime(500);
    rateLimit("ip", requests, 5, 1000);

    expect(requests.get("ip")?.windowStart).toEqual(windowStart);
    expect(requests.get("ip")?.count).toBe(2);
  });
});

describe("rateLimitMiddleware", () => {
  const makeRes = () => {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  it("responds 500 when the request has no ip", () => {
    const res = makeRes();
    const next = vi.fn();
    rateLimitMiddleware({} as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next until 60 requests, then responds 429", () => {
    const ip = "203.0.113.7";
    const next = vi.fn();

    for (let i = 0; i < 60; i++) {
      rateLimitMiddleware(
        { ip } as Request,
        makeRes() as unknown as Response,
        next,
      );
    }
    expect(next).toHaveBeenCalledTimes(60);

    const res = makeRes();
    rateLimitMiddleware({ ip } as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(60);
  });
});
