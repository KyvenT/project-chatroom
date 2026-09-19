import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authMiddleware from "../../src/middleware/authMiddleware.js";

vi.mock("../../src/env.js", () => ({ default: { JWT_SECRET: "test-secret" } }));

const makeRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const run = (authorization?: string) => {
  const req = { headers: { authorization } } as Request;
  const res = makeRes();
  const next = vi.fn();
  authMiddleware(req, res as unknown as Response, next);
  return { req, res, next };
};

describe("authMiddleware", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("rejects requests with no token", () => {
    const { res, next } = run();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a header with no token after the scheme", () => {
    const { res } = run("Bearer");
    expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
  });

  it("rejects a token signed with the wrong secret", () => {
    const token = jwt.sign({ userId: "u1", isGuest: false }, "other-secret");
    const { res, next } = run(`Bearer ${token}`);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("reports expired tokens", () => {
    const token = jwt.sign({ userId: "u1", isGuest: false }, "test-secret", {
      expiresIn: -10,
    });
    const { res, next } = run(`Bearer ${token}`);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token with no user info", () => {
    const token = jwt.sign({}, "test-secret");
    const { res, next } = run(`Bearer ${token}`);
    expect(res.json).toHaveBeenCalledWith({ error: "Error decrypting token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("sets userId and isGuest and calls next for a valid token", () => {
    const token = jwt.sign({ userId: "u1", isGuest: true }, "test-secret");
    const { req, next } = run(`Bearer ${token}`);
    expect(req.userId).toBe("u1");
    expect(req.isGuest).toBe(true);
    expect(next).toHaveBeenCalledOnce();
  });
});
