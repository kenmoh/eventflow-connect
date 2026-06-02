// Simple server-side in-memory cache
// Note: In serverless, this only lasts for the duration of the function instance

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache<T>(key: string, data: T, ttlMs: number = 60000) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

export function invalidateCache(key: string) {
  cache.delete(key);
}

export function clearCache() {
  cache.clear();
}
