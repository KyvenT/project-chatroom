import { NextFunction, Request, Response } from "express";

export type RateLimitResult = { ok: true } | { ok: false };
export type RateLimitWindowCount = { count: number; windowStart: Date };

// Makes a middleware allowing each IP `limit` requests per `interval` ms
const createRateLimiter = (limit: number, interval: number) => {
  const requests = new Map<string, RateLimitWindowCount>();

  // forget windows that have ended, so the map doesn't grow forever
  setInterval(() => {
    const now = Date.now();
    requests.forEach((window, ip) => {
      if (now - window.windowStart.getTime() > interval) requests.delete(ip);
    });
  }, interval).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.ip) {
      res.status(500).json({ message: "Request missing ip" });
      return;
    }

    if (!rateLimit(req.ip, requests, limit, interval).ok) {
      res.status(429).json({ message: "Too many requests" });
      return;
    }

    next();
  };
};

// every request: 60 a minute
export const rateLimitMiddleware = createRateLimiter(60, 60 * 1000);

// logging in, signing up and creating guests: 10 per 15 minutes, to slow
// down password guessing and mass account creation
export const authRateLimitMiddleware = createRateLimiter(10, 15 * 60 * 1000);

// loading profile pictures: a chat can show many at once, and each version
// is only fetched once, so these get their own, larger allowance
export const avatarRateLimitMiddleware = createRateLimiter(600, 60 * 1000);

// sending files: 10 a minute, since each one is stored
export const uploadRateLimitMiddleware = createRateLimiter(10, 60 * 1000);

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
