import express, { NextFunction, Request, Response } from "express";

// Reads the request body as bytes, whatever its Content-Type (the type is
// checked once it's read), up to `limit` bytes. Errors are sent as JSON like
// the rest of the API.
export const readRawBody =
  (limit: number) => (req: Request, res: Response, next: NextFunction) =>
    express.raw({ type: () => true, limit })(req, res, (err?: any) => {
      if (err) {
        const tooLarge = err.type === "entity.too.large";
        res.status(tooLarge ? 413 : 400).json({
          message: tooLarge
            ? "The file is too large"
            : "Couldn't read the file",
        });
        return;
      }
      next();
    });
