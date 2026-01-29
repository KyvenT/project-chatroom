import { NextFunction, Request, Response } from "express";

export type RateLimitResult = { ok: true } | { ok: false };
export type RateLimitWindowCount = { count: number; windowStart: Date };

const httpRequests = new Map<string, RateLimitWindowCount>();
const LIMIT_PER_INTERVAL = 60;
const TIME_INTERVAL = 60 * 1000; // 60 * 1000 = 60sec

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.ip) {
    res.status(500).json({ message: "Request missing ip" });
    return;
  }

  const result = rateLimit(
    req.ip,
    httpRequests,
    LIMIT_PER_INTERVAL,
    TIME_INTERVAL,
  );

  if (!result.ok) {
    res.status(429).json({ message: "Too many requests" });
    return;
  }

  next();
};

export const rateLimit = (
  identifier: string,
  requests: Map<string, RateLimitWindowCount>,
  limit: number,
  interval: number,
): RateLimitResult => {
  const now = new Date();
  let requestCount = requests.get(identifier);

  if (
    !requestCount ||
    now.getTime() - requestCount.windowStart.getTime() > interval
  ) {
    requestCount = { count: 1, windowStart: new Date() };
    requests.set(identifier, requestCount);
    return { ok: true };
  }

  if (requestCount.count >= limit) {
    return { ok: false };
  }

  requestCount = {
    count: requestCount.count + 1,
    windowStart: requestCount.windowStart,
  };

  requests.set(identifier, requestCount);
  return { ok: true };
};
