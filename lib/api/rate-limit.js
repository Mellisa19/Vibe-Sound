/**
 * Tiny in-memory rate limiter for the paid/expensive AI endpoints.
 * Per process only; enough to stop accidental loops from a browser tab.
 */
const buckets = new Map();

function clientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "local";
}

export function rateLimit(request, { limit = 20, windowMs = 60_000 } = {}) {
  const key = clientKey(request);
  const now = Date.now();
  const existing = (buckets.get(key) || []).filter((time) => now - time < windowMs);

  if (existing.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - existing[0])) / 1000);
    buckets.set(key, existing);
    return { ok: false, retryAfter };
  }

  existing.push(now);
  buckets.set(key, existing);

  // Keep the map from growing in long-running dev sessions.
  if (buckets.size > 500) {
    for (const [entryKey, times] of buckets) {
      if (!times.length || now - times[times.length - 1] > windowMs * 4) {
        buckets.delete(entryKey);
      }
    }
  }

  return { ok: true };
}
