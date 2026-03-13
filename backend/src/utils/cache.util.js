const cache = new Map();

export function setCache(key, value, ttlSeconds) {
  const expireAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expireAt });
}

export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function clearCache(key) {
  cache.delete(key);
}

export function clearAllCache() {
  cache.clear();
}
