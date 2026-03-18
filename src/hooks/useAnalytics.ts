/**
 * React hook for accessing analytics service
 */

import { useCallback } from "react";
import { analytics } from "../services/analytics";

export const useAnalytics = () => {
  /**
   * Track a performance metric
   */
  const trackPerformance = useCallback(
    (name: string, duration: number, metadata?: Record<string, unknown>) => {
      analytics.trackPerformance(name, duration, metadata);
    },
    [],
  );

  /**
   * Measure and track a function's execution time
   */
  const measurePerformance = useCallback(
    async <T>(
      name: string,
      fn: () => Promise<T>,
      metadata?: Record<string, unknown>,
    ): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - startTime;
        analytics.trackPerformance(name, duration, metadata);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        analytics.trackPerformance(name, duration, {
          ...metadata,
          error: true,
        });
        throw error;
      }
    },
    [],
  );

  /**
   * Track a user action
   */
  const trackUserAction = useCallback(
    (action: string, metadata?: Record<string, unknown>) => {
      analytics.trackUserAction(action, metadata);
    },
    [],
  );

  /**
   * Log an error
   */
  const logError = useCallback(
    (
      message: string,
      source: string,
      severity: "error" | "warning" | "info" = "error",
      context?: Record<string, unknown>,
      stack?: string,
    ) => {
      analytics.logError(message, source, severity, context, stack);
    },
    [],
  );

  /**
   * Get analytics summary
   */
  const getSummary = useCallback(() => {
    return analytics.getSummary();
  }, []);

  /**
   * Export analytics data
   */
  const exportData = useCallback(() => {
    return analytics.export();
  }, []);

  return {
    trackPerformance,
    measurePerformance,
    trackUserAction,
    logError,
    getSummary,
    exportData,
  };
};
