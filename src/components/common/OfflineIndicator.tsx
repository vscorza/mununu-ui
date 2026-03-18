/**
 * Offline Indicator Component
 * Displays the current online/offline status and queued operations
 */

import { useOffline } from "../../hooks/useOffline";
import "./OfflineIndicator.css";

/**
 * OfflineIndicator Component
 * Shows online/offline status and queued operations count
 */
export const OfflineIndicator = () => {
  const { isOnline, queueSize, queuedOperations } = useOffline();

  if (isOnline && queueSize === 0) {
    return null; // Don't show anything when online and no queue
  }

  return (
    <div className={`offline-indicator ${isOnline ? "online" : "offline"}`}>
      <div className="offline-indicator-content">
        <span className="offline-indicator-icon">{isOnline ? "✓" : "⚠"}</span>
        <span className="offline-indicator-text">
          {isOnline
            ? queueSize > 0
              ? `Syncing ${queueSize} operation${queueSize !== 1 ? "s" : ""}...`
              : "Online"
            : `Offline${queueSize > 0 ? ` (${queueSize} queued)` : ""}`}
        </span>
      </div>
      {queueSize > 0 && (
        <div className="offline-indicator-queue">
          {queuedOperations.slice(0, 3).map((op) => (
            <div key={op.id} className="offline-indicator-queue-item">
              {op.type === "api"
                ? `${op.method || "GET"} ${op.endpoint}`
                : op.type}
            </div>
          ))}
          {queueSize > 3 && (
            <div className="offline-indicator-queue-more">
              +{queueSize - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};
