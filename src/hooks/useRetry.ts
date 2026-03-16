/**
 * Hook for retrying API calls with exponential backoff
 * Provides configurable retry logic for handling transient failures
 */

import { useCallback, useRef } from 'react'
import { AxiosError } from 'axios'

export interface RetryConfig {
  maxRetries?: number // Maximum number of retry attempts (default: 3)
  initialDelay?: number // Initial delay in milliseconds (default: 1000)
  maxDelay?: number // Maximum delay in milliseconds (default: 30000)
  backoffMultiplier?: number // Multiplier for exponential backoff (default: 2)
  retryableStatusCodes?: number[] // HTTP status codes that should trigger retry (default: [500, 502, 503, 504])
  retryableErrorCodes?: string[] // Error codes that should trigger retry (default: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND'])
  onRetry?: (attempt: number, error: unknown) => void // Callback before each retry
  shouldRetry?: (error: unknown) => boolean // Custom function to determine if error should be retried
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetry' | 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatusCodes: [500, 502, 503, 504],
  retryableErrorCodes: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND'],
}

/**
 * Determines if an error should be retried based on the configuration
 */
const isRetryableError = (error: unknown, config: RetryConfig): boolean => {
  // Use custom shouldRetry function if provided
  if (config.shouldRetry) {
    return config.shouldRetry(error)
  }

  // Don't retry rate limit errors (429) - they have their own handling
  if (error instanceof AxiosError) {
    if (error.response?.status === 429) {
      return false
    }

    // Check if status code is retryable
    const statusCode = error.response?.status
    if (statusCode && config.retryableStatusCodes?.includes(statusCode)) {
      return true
    }

    // Check if error code is retryable
    const errorCode = error.code
    if (errorCode && config.retryableErrorCodes?.includes(errorCode)) {
      return true
    }

    // Retry on network errors (no response)
    if (!error.response && error.request) {
      return true
    }
  }

  return false
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const initialDelay = config.initialDelay ?? DEFAULT_CONFIG.initialDelay
  const maxDelay = config.maxDelay ?? DEFAULT_CONFIG.maxDelay
  const multiplier = config.backoffMultiplier ?? DEFAULT_CONFIG.backoffMultiplier

  const delay = initialDelay * Math.pow(multiplier, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Sleep for the specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const useRetry = () => {
  const activeRetries = useRef<Map<string, AbortController>>(new Map())

  /**
   * Retry a function with exponential backoff
   * @param fn - The async function to retry
   * @param config - Retry configuration
   * @returns Promise that resolves with the function result or rejects after all retries fail
   */
  const retry = useCallback(
    async <T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> => {
      const maxRetries = config.maxRetries ?? DEFAULT_CONFIG.maxRetries
      let lastError: unknown

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn()
          return result
        } catch (error) {
          lastError = error

          // Don't retry if error is not retryable
          if (!isRetryableError(error, config)) {
            throw error
          }

          // Don't retry on the last attempt
          if (attempt >= maxRetries) {
            break
          }

          // Calculate delay and wait before retrying
          const delay = calculateDelay(attempt, config)

          // Call onRetry callback if provided
          if (config.onRetry) {
            config.onRetry(attempt + 1, error)
          }

          await sleep(delay)
        }
      }

      // All retries exhausted, throw the last error
      throw lastError
    },
    []
  )

  /**
   * Cancel all active retries for a given key
   */
  const cancelRetry = useCallback((key: string) => {
    const controller = activeRetries.current.get(key)
    if (controller) {
      controller.abort()
      activeRetries.current.delete(key)
    }
  }, [])

  /**
   * Cancel all active retries
   */
  const cancelAllRetries = useCallback(() => {
    activeRetries.current.forEach(controller => controller.abort())
    activeRetries.current.clear()
  }, [])

  return {
    retry,
    cancelRetry,
    cancelAllRetries,
  }
}
