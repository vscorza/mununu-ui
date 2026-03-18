/**
 * Offline Sync Service
 * Processes queued operations when the app comes back online
 */

import { offlineQueue, type QueuedOperation } from "./offlineQueue";
import { apiClient, aiApiClient } from "../api/client";

/**
 * Process a single queued operation
 */
const processQueuedOperation = async (
  operation: QueuedOperation,
): Promise<boolean> => {
  if (operation.type !== "api" || !operation.endpoint || !operation.method) {
    return false;
  }

  try {
    const client = operation.endpoint.includes("/ai/")
      ? aiApiClient
      : apiClient;
    const method =
      (operation.method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch") || "get";

    let response;
    if (method === "get" || method === "delete") {
      response = await client[method](operation.endpoint);
    } else {
      response = await client[method](operation.endpoint, operation.payload);
    }

    if (response.status >= 200 && response.status < 300) {
      console.log("[OfflineSync] Successfully synced operation:", operation.id);
      return true;
    }

    return false;
  } catch (error) {
    console.warn(
      "[OfflineSync] Failed to sync operation:",
      operation.id,
      error,
    );
    return false;
  }
};

/**
 * Process all queued operations
 */
export const syncQueuedOperations = async (): Promise<{
  success: number;
  failed: number;
}> => {
  if (!navigator.onLine) {
    console.log("[OfflineSync] Still offline, skipping sync");
    return { success: 0, failed: 0 };
  }

  const operations = offlineQueue.getAll();
  if (operations.length === 0) {
    return { success: 0, failed: 0 };
  }

  console.log(
    `[OfflineSync] Processing ${operations.length} queued operations...`,
  );

  let success = 0;
  let failed = 0;

  for (const operation of operations) {
    const result = await processQueuedOperation(operation);

    if (result) {
      offlineQueue.dequeue(operation.id);
      success++;
    } else {
      // Increment retry count
      offlineQueue.incrementRetry(operation.id);

      // Remove if max retries exceeded
      if (operation.maxRetries && operation.retries >= operation.maxRetries) {
        offlineQueue.dequeue(operation.id);
        failed++;
        console.warn(
          "[OfflineSync] Max retries exceeded for operation:",
          operation.id,
        );
      }
    }

    // Small delay between operations to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    `[OfflineSync] Sync complete: ${success} succeeded, ${failed} failed`,
  );
  return { success, failed };
};

/**
 * Start listening for online events and sync automatically
 */
export const startAutoSync = (): (() => void) => {
  const handleOnline = async () => {
    console.log("[OfflineSync] App is back online, starting sync...");
    await syncQueuedOperations();
  };

  window.addEventListener("online", handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
  };
};
