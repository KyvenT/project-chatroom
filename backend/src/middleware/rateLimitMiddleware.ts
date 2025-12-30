import { NextFunction, Request, Response } from "express";

const requests = new Map<string, { count: number; timeOfLastRequest: Date }>();
const limitPerInterval = 20;
const timeInterval = 60 * 1000; // 60 * 1000 = 60sec

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.ip) {
    res.status(500).json({ message: "Request missing ip" });
    return;
  }

  let requestCount = requests.get(req.ip);

  if (!requestCount) {
    requestCount = { count: 1, timeOfLastRequest: new Date() };
  } else {
    if (
      new Date().getTime() - requestCount.timeOfLastRequest.getTime() <=
      timeInterval
    ) {
      requestCount = {
        count: requestCount.count + 1,
        timeOfLastRequest: new Date(),
      };
    } else {
      requestCount = { count: 1, timeOfLastRequest: new Date() };
    }
  }

  if (requestCount.count > limitPerInterval) {
    res.status(500).json({ message: "Too many requests" });
    return;
  }

  requests.set(req.ip, requestCount);
  next();
};
