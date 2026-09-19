import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import z from "zod";
import { validationMiddleware } from "../../src/middleware/validationMiddleware.js";
import { validate } from "../../src/validators/validate.js";

const schema = z.object({ name: z.string().min(2) });

describe("validate", () => {
  it("returns parsed data on success", () => {
    expect(validate(schema, { name: "bob" })).toEqual({
      ok: true,
      data: { name: "bob" },
    });
  });

  it("returns the zod error on failure", () => {
    const result = validate(schema, { name: "b" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.issues).toHaveLength(1);
  });
});

describe("validationMiddleware", () => {
  const makeRes = () => {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  it("stores validated data on req.data and calls next", () => {
    const req = { body: { name: "bob", extra: "stripped" } } as Request;
    const res = makeRes();
    const next = vi.fn();

    validationMiddleware(schema, (r) => r.body)(
      req,
      res as unknown as Response,
      next,
    );

    expect(req.data).toEqual({ name: "bob" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds 400 and does not call next on invalid input", () => {
    const req = { body: { name: "" } } as Request;
    const res = makeRes();
    const next = vi.fn();

    validationMiddleware(schema, (r) => r.body)(
      req,
      res as unknown as Response,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "input validation error",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
