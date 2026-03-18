/**
 * Correlation ID Display Component
 *
 * Displays correlation IDs for debugging and support
 */

import { useState } from "react";
import { Button } from "./Button";
import "./CorrelationIdDisplay.css";

interface CorrelationIdDisplayProps {
  /** Correlation ID to display */
  correlationId: string | null;
  /** Optional label */
  label?: string;
  /** Optional className */
  className?: string;
  /** Show copy button */
  showCopyButton?: boolean;
}

export const CorrelationIdDisplay = ({
  correlationId,
  label = "Correlation ID",
  className = "",
  showCopyButton = true,
}: CorrelationIdDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!correlationId) return;

    try {
      await navigator.clipboard.writeText(correlationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy correlation ID:", err);
    }
  };

  if (!correlationId) {
    return null;
  }

  return (
    <div className={`correlation-id-display ${className}`}>
      <div className="correlation-id-label">{label}:</div>
      <div className="correlation-id-value" title={correlationId}>
        {correlationId}
      </div>
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="correlation-id-copy-button"
          title="Copy correlation ID"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </Button>
      )}
    </div>
  );
};
