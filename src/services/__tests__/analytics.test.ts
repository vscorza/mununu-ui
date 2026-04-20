import { describe, it, expect, beforeEach } from "vitest";
import { analytics } from "../analytics";

describe("analytics", () => {
  beforeEach(() => {
    analytics.clear();
  });

  describe("trackApiCall", () => {
    it("records an API call metric", () => {
      analytics.trackApiCall({
        endpoint: "/health",
        method: "GET",
        statusCode: 200,
        duration: 50,
        success: true,
      });

      const data = analytics.getAllData();
      expect(data.apiCalls).toHaveLength(1);
      expect(data.apiCalls[0]).toMatchObject({
        endpoint: "/health",
        method: "GET",
        statusCode: 200,
        duration: 50,
        success: true,
      });
      expect(data.apiCalls[0].timestamp).toBeGreaterThan(0);
    });

    it("caps entries at 1000", () => {
      for (let i = 0; i < 1010; i++) {
        analytics.trackApiCall({
          endpoint: `/api/${i}`,
          method: "GET",
          duration: 10,
          success: true,
        });
      }

      const data = analytics.getAllData();
      expect(data.apiCalls.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("trackPerformance", () => {
    it("records a performance metric", () => {
      analytics.trackPerformance("render", 42, { component: "App" });

      const data = analytics.getAllData();
      expect(data.performance).toHaveLength(1);
      expect(data.performance[0]).toMatchObject({
        name: "render",
        duration: 42,
        metadata: { component: "App" },
      });
    });
  });

  describe("logError", () => {
    it("records an error log", () => {
      analytics.logError("something broke", "TestSource", "error", {
        detail: "context",
      });

      const data = analytics.getAllData();
      expect(data.errors).toHaveLength(1);
      expect(data.errors[0]).toMatchObject({
        message: "something broke",
        source: "TestSource",
        severity: "error",
        context: { detail: "context" },
      });
    });

    it("defaults severity to error", () => {
      analytics.logError("fail", "src");

      const data = analytics.getAllData();
      expect(data.errors[0].severity).toBe("error");
    });
  });

  describe("trackUserAction", () => {
    it("records a user action", () => {
      analytics.trackUserAction("click_verify", { file: "test.ctxdsl" });

      const data = analytics.getAllData();
      expect(data.userActions).toHaveLength(1);
      expect(data.userActions[0]).toMatchObject({
        action: "click_verify",
        metadata: { file: "test.ctxdsl" },
      });
    });
  });

  describe("getSummary", () => {
    it("returns correct counts", () => {
      analytics.trackApiCall({ endpoint: "/a", method: "GET", duration: 100, success: true });
      analytics.trackApiCall({ endpoint: "/b", method: "POST", duration: 200, success: false });
      analytics.logError("err", "src", "error");
      analytics.logError("warn", "src", "warning");
      analytics.trackUserAction("click");

      const summary = analytics.getSummary();
      expect(summary.totalApiCalls).toBe(2);
      expect(summary.successfulApiCalls).toBe(1);
      expect(summary.failedApiCalls).toBe(1);
      expect(summary.averageApiCallDuration).toBe(150);
      expect(summary.totalErrors).toBe(1);
      expect(summary.totalWarnings).toBe(1);
      expect(summary.totalUserActions).toBe(1);
    });

    it("returns 0 average when no API calls", () => {
      const summary = analytics.getSummary();
      expect(summary.averageApiCallDuration).toBe(0);
    });

    it("includes slow operations sorted by duration", () => {
      analytics.trackPerformance("fast", 50);
      analytics.trackPerformance("slow", 200);
      analytics.trackPerformance("medium", 150);

      const summary = analytics.getSummary();
      expect(summary.slowOperations).toHaveLength(2); // Only > 100ms
      expect(summary.slowOperations[0].name).toBe("slow");
      expect(summary.slowOperations[1].name).toBe("medium");
    });
  });

  describe("clear", () => {
    it("clears all data", () => {
      analytics.trackApiCall({ endpoint: "/a", method: "GET", duration: 10, success: true });
      analytics.logError("err", "src");
      analytics.trackPerformance("p", 10);
      analytics.trackUserAction("a");

      analytics.clear();

      const data = analytics.getAllData();
      expect(data.apiCalls).toHaveLength(0);
      expect(data.errors).toHaveLength(0);
      expect(data.performance).toHaveLength(0);
      expect(data.userActions).toHaveLength(0);
    });
  });

  describe("export", () => {
    it("returns valid JSON", () => {
      analytics.trackApiCall({ endpoint: "/a", method: "GET", duration: 10, success: true });

      const exported = analytics.export();
      const parsed = JSON.parse(exported);
      expect(parsed.apiCalls).toHaveLength(1);
    });
  });
});
