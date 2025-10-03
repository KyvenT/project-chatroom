import z, { ZodType } from "zod";

export const validate = (schema: ZodType, data: Object) => {
  try {
    schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(err.issues);
      return;
    }
    console.error("error trying to validate user data", err);
  }
};
