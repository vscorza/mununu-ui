import { describe, it, expect, vi, beforeEach } from "vitest";

// offlineQueue is a singleton, so we need to re-import for each test
// to reset state. Instead, we use its clear() method.
import { offlineQueue } from "../offlineQueue";

describe("offlineQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    offlineQueue.clear();
  });

  it("starts with an empty queue", () => {
    expect(offlineQueue.size()).toBe(0);
    expect(offlineQueue.getAll()).toEqual([]);
  });

  it("enqueues an operation and assigns an id", () => {
    const id = offlineQueue.enqueue({ type: "api", endpoint: "/test", method: "POST" });

    expect(id).toBeTruthy();
    expect(offlineQueue.size()).toBe(1);

    const ops = offlineQueue.getAll();
    expect(ops[0]).toMatchObject({
      id,
      type: "api",
      endpoint: "/test",
      method: "POST",
      retries: 0,
    });
    expect(ops[0].timestamp).toBeGreaterThan(0);
  });

  it("dequeues an operation by id", () => {
    const id = offlineQueue.enqueue({ type: "api" });
    expect(offlineQueue.size()).toBe(1);

    const result = offlineQueue.dequeue(id);
    expect(result).toBe(true);
    expect(offlineQueue.size()).toBe(0);
  });

  it("returns false when dequeuing a nonexistent id", () => {
    expect(offlineQueue.dequeue("nonexistent")).toBe(false);
  });

  it("persists queue to localStorage", () => {
    offlineQueue.enqueue({ type: "api", endpoint: "/persist" });

    const stored = localStorage.getItem("holiday_offline_queue");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].endpoint).toBe("/persist");
  });

  it("filters operations by type", () => {
    offlineQueue.enqueue({ type: "api", endpoint: "/a" });
    offlineQueue.enqueue({ type: "action" });
    offlineQueue.enqueue({ type: "api", endpoint: "/b" });

    const apiOps = offlineQueue.getByType("api");
    expect(apiOps).toHaveLength(2);
    expect(apiOps[0].endpoint).toBe("/a");

    const actionOps = offlineQueue.getByType("action");
    expect(actionOps).toHaveLength(1);
  });

  it("increments retry count", () => {
    const id = offlineQueue.enqueue({ type: "api" });
    expect(offlineQueue.getAll()[0].retries).toBe(0);

    offlineQueue.incrementRetry(id);
    expect(offlineQueue.getAll()[0].retries).toBe(1);

    offlineQueue.incrementRetry(id);
    expect(offlineQueue.getAll()[0].retries).toBe(2);
  });

  it("returns false when incrementing retry for nonexistent id", () => {
    expect(offlineQueue.incrementRetry("nonexistent")).toBe(false);
  });

  it("caps queue at MAX_QUEUE_SIZE (100)", () => {
    for (let i = 0; i < 105; i++) {
      offlineQueue.enqueue({ type: "api", endpoint: `/op${i}` });
    }
    expect(offlineQueue.size()).toBeLessThanOrEqual(100);
  });

  it("clears all operations", () => {
    offlineQueue.enqueue({ type: "api" });
    offlineQueue.enqueue({ type: "action" });
    expect(offlineQueue.size()).toBe(2);

    offlineQueue.clear();
    expect(offlineQueue.size()).toBe(0);
    expect(offlineQueue.getAll()).toEqual([]);
  });

  it("notifies subscribers on enqueue", () => {
    const listener = vi.fn();
    offlineQueue.subscribe(listener);

    // Subscribe immediately notifies with current queue
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([]);

    offlineQueue.enqueue({ type: "api" });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toHaveLength(1);
  });

  it("unsubscribe stops notifications", () => {
    const listener = vi.fn();
    const unsubscribe = offlineQueue.subscribe(listener);

    // Initial notification
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    offlineQueue.enqueue({ type: "api" });

    // Should still be 1 (no new notification)
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("getAll returns a copy, not a reference", () => {
    offlineQueue.enqueue({ type: "api" });
    const ops1 = offlineQueue.getAll();
    const ops2 = offlineQueue.getAll();

    expect(ops1).toEqual(ops2);
    expect(ops1).not.toBe(ops2); // Different array instances
  });
});
