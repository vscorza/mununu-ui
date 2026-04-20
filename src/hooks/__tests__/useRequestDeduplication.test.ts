import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRequestDeduplication } from "../useRequestDeduplication";

describe("useRequestDeduplication", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates deterministic request keys with sorted params", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    const key1 = result.current.createRequestKey("/api/test", {
      b: 2,
      a: 1,
    });
    const key2 = result.current.createRequestKey("/api/test", {
      a: 1,
      b: 2,
    });

    expect(key1).toBe(key2);
  });

  it("reports no request in flight initially", () => {
    const { result } = renderHook(() => useRequestDeduplication());
    expect(result.current.isRequestInFlight("key")).toBe(false);
  });

  it("tracks in-flight requests after startRequest", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    act(() => {
      result.current.startRequest("key1");
    });

    expect(result.current.isRequestInFlight("key1")).toBe(true);
    expect(result.current.isRequestInFlight("key2")).toBe(false);
  });

  it("returns an AbortController from startRequest", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    let controller: AbortController | undefined;
    act(() => {
      controller = result.current.startRequest("key1");
    });

    expect(controller).toBeInstanceOf(AbortController);
    expect(controller!.signal.aborted).toBe(false);
  });

  it("aborts previous request when starting a duplicate", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    let firstController: AbortController | undefined;
    let secondController: AbortController | undefined;

    act(() => {
      firstController = result.current.startRequest("key1");
      secondController = result.current.startRequest("key1");
    });

    expect(firstController!.signal.aborted).toBe(true);
    expect(secondController!.signal.aborted).toBe(false);
  });

  it("removes request on finishRequest", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    act(() => {
      result.current.startRequest("key1");
    });
    expect(result.current.isRequestInFlight("key1")).toBe(true);

    act(() => {
      result.current.finishRequest("key1");
    });
    expect(result.current.isRequestInFlight("key1")).toBe(false);
  });

  it("aborts and removes request on cancelRequest", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    let controller: AbortController | undefined;
    act(() => {
      controller = result.current.startRequest("key1");
    });

    act(() => {
      result.current.cancelRequest("key1");
    });

    expect(controller!.signal.aborted).toBe(true);
    expect(result.current.isRequestInFlight("key1")).toBe(false);
  });

  it("cancelRequest is a no-op for nonexistent keys", () => {
    const { result } = renderHook(() => useRequestDeduplication());
    // Should not throw
    act(() => {
      result.current.cancelRequest("nonexistent");
    });
  });

  it("cancels all requests with cancelAllRequests", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    let c1: AbortController | undefined;
    let c2: AbortController | undefined;
    act(() => {
      c1 = result.current.startRequest("key1");
      c2 = result.current.startRequest("key2");
    });

    act(() => {
      result.current.cancelAllRequests();
    });

    expect(c1!.signal.aborted).toBe(true);
    expect(c2!.signal.aborted).toBe(true);
    expect(result.current.isRequestInFlight("key1")).toBe(false);
    expect(result.current.isRequestInFlight("key2")).toBe(false);
  });

  it("cleans up stale requests older than 5 minutes", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    act(() => {
      result.current.startRequest("stale");
    });

    // Advance past 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(result.current.isRequestInFlight("stale")).toBe(false);
  });

  it("does not clean up requests within 5-minute window", () => {
    const { result } = renderHook(() => useRequestDeduplication());

    act(() => {
      result.current.startRequest("fresh");
    });

    vi.advanceTimersByTime(4 * 60 * 1000);

    expect(result.current.isRequestInFlight("fresh")).toBe(true);
  });
});
