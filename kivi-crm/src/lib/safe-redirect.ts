/**
 * Returns a same-origin, path-only redirect target. Anything that could leave
 * the site (absolute URLs, protocol-relative "//evil.com", backslash tricks,
 * control characters) falls back to `fallback`. Prevents open redirects.
 */
export function safeRedirectPath(target: unknown, fallback = "/"): string {
  if (typeof target !== "string") return fallback;
  const value = target.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://crm.invalid");
    if (url.origin !== "https://crm.invalid") return fallback;
    const path = url.pathname + url.search + url.hash;
    if (path.startsWith("/auth/") || path.startsWith("/api/")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
