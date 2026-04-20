const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Returns an error response string if the request fails the CSRF check,
// or null if the request is safe to proceed.
// Strategy: verify the Origin or Referer header matches the expected host.
// This blocks cross-site form POST attacks. SameSite=lax on the session cookie
// provides a second layer but doesn't cover all legacy scenarios.
export function checkCsrfOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const allowedOrigin = new URL(APP_URL).origin;

  // In development, also allow localhost variants
  const isDev = process.env.NODE_ENV !== "production";

  if (origin) {
    if (origin === allowedOrigin) return null;
    if (isDev && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) {
      return null;
    }
    return "Forbidden: invalid origin";
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === allowedOrigin) return null;
      if (isDev && (refererOrigin.startsWith("http://localhost:") || refererOrigin.startsWith("http://127.0.0.1:"))) {
        return null;
      }
    } catch {
      return "Forbidden: invalid referer";
    }
    return "Forbidden: invalid referer";
  }

  // No Origin or Referer header. Allow in development; block in production
  // to prevent direct cross-site form submissions without any header.
  if (isDev) return null;
  return "Forbidden: missing origin";
}
