/**
 * React hook for offline detection and management
 */

import { useState, useEffect, useCallback } from "react";
import { offlineQueue, type QueuedOperation } from "../services/offlineQueue";
import { startAutoSync, syncQueuedOperations } from "../services/offlineSync";

export interface OfflineStatus {
  isOnline: boolean;
  queueSize: number;
  queuedOperations: QueuedOperation[];
}

/**
 * Hook for detecting online/offline status and managing offline queue
 */
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>(
    [],
  );

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("[Offline] App is now online");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("[Offline] App is now offline");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((queue) => {
      setQueuedOperations(queue);
    });

    return unsubscribe;
  }, []);

  // Start auto-sync when online
  useEffect(() => {
    const cleanup = startAutoSync();
    return cleanup;
  }, []);

  /**
   * Manually trigger sync of queued operations
   */
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      console.warn("[Offline] Cannot sync while offline");
      return { success: 0, failed: 0 };
    }
    return await syncQueuedOperations();
  }, [isOnline]);

  /**
   * Queue an operation for later execution
   */
  const queueOperation = useCallback(
    (
      operation: Omit<QueuedOperation, "id" | "timestamp" | "retries">,
    ): string => {
      return offlineQueue.enqueue(operation);
    },
    [],
  );

  /**
   * Remove an operation from the queue
   */
  const removeQueuedOperation = useCallback((id: string): boolean => {
    return offlineQueue.dequeue(id);
  }, []);

  /**
   * Clear all queued operations
   */
  const clearQueue = useCallback(() => {
    offlineQueue.clear();
  }, []);

  /**
   * Get queued operations by type
   */
  const getQueuedOperationsByType = useCallback(
    (type: QueuedOperation["type"]): QueuedOperation[] => {
      return offlineQueue.getByType(type);
    },
    [],
  );

  return {
    isOnline,
    queueSize: queuedOperations.length,
    queuedOperations,
    queueOperation,
    removeQueuedOperation,
    clearQueue,
    getQueuedOperationsByType,
    syncNow,
  };
};
