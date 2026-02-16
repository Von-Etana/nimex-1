interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new Cache();

// React hook for cached API calls
export const useCachedApi = <T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  ttl?: number
) => {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = apiCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make API call and cache result
    const result = await apiCall();
    apiCache.set(cacheKey, result, ttl);
    return result;
  };
};