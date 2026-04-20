import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRequestCache } from "../useRequestCache";

describe("useRequestCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for a cache miss", () => {
    const { result } = renderHook(() => useRequestCache());
    expect(result.current.getCached("nonexistent")).toBeNull();
  });

  it("stores and retrieves cached data", () => {
    const { result } = renderHook(() => useRequestCache<string>());

    act(() => {
      result.current.setCached("key1", "value1");
    });

    expect(result.current.getCached("key1")).toBe("value1");
  });

  it("expires entries after TTL", () => {
    const { result } = renderHook(() =>
      useRequestCache<string>({ ttl: 1000 }),
    );

    act(() => {
      result.current.setCached("key1", "value1");
    });

    expect(result.current.getCached("key1")).toBe("value1");

    // Advance past TTL
    vi.advanceTimersByTime(1100);
    expect(result.current.getCached("key1")).toBeNull();
  });

  it("evicts oldest entries when maxSize is exceeded", () => {
    const { result } = renderHook(() =>
      useRequestCache<string>({ maxSize: 2 }),
    );

    act(() => {
      result.current.setCached("key1", "first");
      vi.advanceTimersByTime(10);
      result.current.setCached("key2", "second");
      vi.advanceTimersByTime(10);
      result.current.setCached("key3", "third");
    });

    // key1 should have been evicted (oldest)
    expect(result.current.getCached("key1")).toBeNull();
    expect(result.current.getCached("key2")).toBe("second");
    expect(result.current.getCached("key3")).toBe("third");
  });

  it("creates cache keys with sorted params", () => {
    const { result } = renderHook(() => useRequestCache());

    const key1 = result.current.createCacheKey("/api/test", {
      b: 2,
      a: 1,
    });
    const key2 = result.current.createCacheKey("/api/test", {
      a: 1,
      b: 2,
    });

    expect(key1).toBe(key2);
  });

  it("creates different keys for different endpoints", () => {
    const { result } = renderHook(() => useRequestCache());

    const key1 = result.current.createCacheKey("/api/a", { x: 1 });
    const key2 = result.current.createCacheKey("/api/b", { x: 1 });

    expect(key1).not.toBe(key2);
  });

  it("clears a specific cache entry", () => {
    const { result } = renderHook(() => useRequestCache<string>());

    act(() => {
      result.current.setCached("key1", "v1");
      result.current.setCached("key2", "v2");
    });

    act(() => {
      result.current.clearCache("key1");
    });

    expect(result.current.getCached("key1")).toBeNull();
    expect(result.current.getCached("key2")).toBe("v2");
  });

  it("clears all cache entries", () => {
    const { result } = renderHook(() => useRequestCache<string>());

    act(() => {
      result.current.setCached("key1", "v1");
      result.current.setCached("key2", "v2");
    });

    act(() => {
      result.current.clearAllCache();
    });

    expect(result.current.getCached("key1")).toBeNull();
    expect(result.current.getCached("key2")).toBeNull();
  });

  it("invalidates entries matching a string pattern", () => {
    const { result } = renderHook(() => useRequestCache<string>());

    act(() => {
      result.current.setCached("/api/context:1", "v1");
      result.current.setCached("/api/context:2", "v2");
      result.current.setCached("/api/health:1", "v3");
    });

    act(() => {
      result.current.invalidatePattern("/api/context");
    });

    expect(result.current.getCached("/api/context:1")).toBeNull();
    expect(result.current.getCached("/api/context:2")).toBeNull();
    expect(result.current.getCached("/api/health:1")).toBe("v3");
  });

  it("invalidates entries matching a RegExp pattern", () => {
    const { result } = renderHook(() => useRequestCache<string>());

    act(() => {
      result.current.setCached("a:1", "v1");
      result.current.setCached("b:2", "v2");
      result.current.setCached("a:3", "v3");
    });

    act(() => {
      result.current.invalidatePattern(/^a:/);
    });

    expect(result.current.getCached("a:1")).toBeNull();
    expect(result.current.getCached("a:3")).toBeNull();
    expect(result.current.getCached("b:2")).toBe("v2");
  });

  it("cleans expired entries", () => {
    const { result } = renderHook(() =>
      useRequestCache<string>({ ttl: 500 }),
    );

    act(() => {
      result.current.setCached("old", "value1");
    });

    vi.advanceTimersByTime(600);

    act(() => {
      result.current.setCached("new", "value2");
    });

    act(() => {
      result.current.cleanExpired();
    });

    expect(result.current.getCached("old")).toBeNull();
    expect(result.current.getCached("new")).toBe("value2");
  });

  it("reports cache stats", () => {
    const { result } = renderHook(() =>
      useRequestCache<string>({ ttl: 5000, maxSize: 10 }),
    );

    act(() => {
      result.current.setCached("k1", "v1");
      result.current.setCached("k2", "v2");
    });

    const stats = result.current.getCacheStats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(10);
    expect(stats.ttl).toBe(5000);
  });
});
