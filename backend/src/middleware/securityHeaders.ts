import { NextFunction, Request, Response } from "express";

// Only this site's own scripts, data and connections are allowed; styles may
// be inline since the app adds its styles at runtime. Images may be blob:
// URLs, which is how sent image files are shown. The page can't be
// framed by other sites.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.removeHeader("X-Powered-By");
  next();
};
