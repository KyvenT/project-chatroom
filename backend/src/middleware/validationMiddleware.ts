import { Request, Response, NextFunction } from "express";
import { validate } from "../validators/validate.js";
import { ZodType } from "zod";

export const validationMiddleware =
  (schema: ZodType, extractorCallback: (req: Request) => Object) =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = extractorCallback(req);
    const result = validate(schema, data);

    if (!result.ok) {
      res.status(400).json({ message: "input validation error" });
      return;
    }

    req.data = result.data;

    next();
  };
