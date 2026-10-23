/**
 * Small in-process TTL cache for music metadata requests.
 *
 * Apple's public catalogue endpoints are rate limited, and several pages ask
 * for the same charts/search terms. Caching keeps the app responsive and
 * avoids burning the request budget. This is intentionally process-local:
 * correctness does not depend on it, it only removes duplicate work.
 */
const store = new Map();
const inflight = new Map();

export async function cached(key, ttlMs, loader) {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    return hit.value;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
