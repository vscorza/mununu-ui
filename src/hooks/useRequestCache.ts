/**
 * Hook for caching API responses
 * Reduces redundant API calls by caching responses based on input hash
 */

import { useRef, useCallback } from "react";

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum number of cached items (default: 50)
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 50;

export const useRequestCache = <T = unknown>(options: CacheOptions = {}) => {
  const cache = useRef<Map<string, CachedResponse<T>>>(new Map());
  const ttl = options.ttl ?? DEFAULT_TTL;
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;

  // Create a cache key from endpoint and params
  const createCacheKey = useCallback(
    (endpoint: string, params: unknown): string => {
      const paramsStr = JSON.stringify(
        params,
        Object.keys(params as Record<string, unknown>).sort(),
      );
      return `${endpoint}:${paramsStr}`;
    },
    [],
  );

  // Get cached response if available and not expired
  const getCached = useCallback(
    (key: string): T | null => {
      const cached = cache.current.get(key);
      if (!cached) return null;

      // Check if cache is expired
      const now = Date.now();
      if (now - cached.timestamp > ttl) {
        cache.current.delete(key);
        return null;
      }

      return cached.data;
    },
    [ttl],
  );

  // Set cached response
  const setCached = useCallback(
    (key: string, data: T): void => {
      // Enforce max size by removing oldest entries
      if (cache.current.size >= maxSize) {
        const entries = Array.from(cache.current.entries());
        // Sort by timestamp and remove oldest
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, entries.length - maxSize + 1);
        toRemove.forEach(([k]) => cache.current.delete(k));
      }

      cache.current.set(key, {
        data,
        timestamp: Date.now(),
        key,
      });
    },
    [maxSize],
  );

  // Clear specific cache entry
  const clearCache = useCallback((key: string): void => {
    cache.current.delete(key);
  }, []);

  // Clear all cache
  const clearAllCache = useCallback((): void => {
    cache.current.clear();
  }, []);

  // Invalidate cache entries matching a pattern
  const invalidatePattern = useCallback((pattern: string | RegExp): void => {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    const keysToDelete: string[] = [];

    cache.current.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => cache.current.delete(key));
  }, []);

  // Clean expired entries
  const cleanExpired = useCallback((): void => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    cache.current.forEach((cached, key) => {
      if (now - cached.timestamp > ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => cache.current.delete(key));
  }, [ttl]);

  // Get cache statistics (as a function to avoid ref access during render)
  const getCacheStats = useCallback(() => {
    return {
      size: cache.current.size,
      maxSize,
      ttl,
    };
  }, [maxSize, ttl]);

  return {
    createCacheKey,
    getCached,
    setCached,
    clearCache,
    clearAllCache,
    invalidatePattern,
    cleanExpired,
    getCacheStats,
  };
};
