// Only follow same-origin paths from a ?next= param; "//evil.com" and
// "/\evil.com" are treated by browsers as protocol-relative URLs.
export const getSafeRedirect = (next: string | null, fallback = "/chat") =>
  next && next.startsWith("/") && !/^\/[/\\]/.test(next) ? next : fallback;
