import { Response } from "express";
import z, { ZodType } from "zod";

export const validate = <T extends ZodType>(
  schema: T,
  data: Object,
  res: Response
): z.infer<T> | undefined => {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(err.issues);
      return;
    }
    console.error("error trying to validate user data", err);
    res.status(500).json({ error: "input validation error" });
  }
};
