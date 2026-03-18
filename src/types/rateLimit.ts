/**
 * Rate limit error information extracted from API response
 */
export interface RateLimitError {
  code: "RATE_LIMIT_EXCEEDED";
  message: string;
  retryAfterSeconds: number | null;
  details?: string;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "RATE_LIMIT_EXCEEDED"
  );
}

/**
 * Extract retry-after seconds from error details string
 * Examples: "Retry after 7 seconds", "Retry after 30 seconds"
 */
export function extractRetryAfterSeconds(details?: string): number | null {
  if (!details) return null;

  const match = details.match(/(\d+)\s*seconds?/i);
  if (match && match[1]) {
    const seconds = parseInt(match[1], 10);
    return isNaN(seconds) ? null : seconds;
  }

  return null;
}
