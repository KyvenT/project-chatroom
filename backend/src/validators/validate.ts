import z, { ZodType } from "zod";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: z.ZodError };

export const validate = <T extends ZodType>(
  schema: T,
  data: Object,
): ValidationResult<z.infer<T>> => {
  const result = schema.safeParse(data);

  if (!result.success) {
    return { ok: false, error: result.error };
  }

  return { ok: true, data: result.data };
};
