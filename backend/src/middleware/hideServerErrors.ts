import { NextFunction, Request, Response } from "express";

// Errors from the database library describe queries and tables
const looksInternal = (message: string) =>
  /prisma|invocation|\n/i.test(message);

// Server errors (5xx) whose message would reveal internals get a generic
// message instead; the details are logged where they happen
export const hideServerErrors = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const json = res.json.bind(res);
  res.json = (body?: any) => {
    if (
      res.statusCode >= 500 &&
      typeof body?.message === "string" &&
      looksInternal(body.message)
    ) {
      return json({ ...body, message: "Something went wrong" });
    }
    return json(body);
  };
  next();
};
