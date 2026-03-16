import { AxiosError } from 'axios'
import React from 'react'
import { useToast } from './useToast'
import { RateLimitNotification } from '../components/common/RateLimitNotification'
import type { RateLimitError } from '../types/rateLimit'
import { extractRetryAfterSeconds, isRateLimitError } from '../types/rateLimit'

export interface ErrorHandlerOptions {
  onRetry?: () => void | Promise<void>
  showRateLimitNotification?: boolean
}

export const useErrorHandler = () => {
  const toast = useToast()

  const handleError = (
    error: unknown,
    defaultMessage?: string,
    options?: ErrorHandlerOptions
  ): string => {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as
        | {
            success?: boolean
            error?: {
              message: string
              code: string
              details?: string
            }
          }
        | undefined

      // Handle rate limit errors (429 status)
      if (error.response?.status === 429 || apiError?.error?.code === 'RATE_LIMIT_EXCEEDED') {
        const retryAfterSeconds = extractRetryAfterSeconds(apiError?.error?.details)
        const rateLimitError: RateLimitError = {
          code: 'RATE_LIMIT_EXCEEDED',
          message:
            apiError?.error?.message || 'Rate limit exceeded. Please wait before trying again.',
          retryAfterSeconds,
          details: apiError?.error?.details,
        }

        // Show rate limit notification if enabled
        if (options?.showRateLimitNotification !== false) {
          toast.showCustom(
            React.createElement(RateLimitNotification, {
              error: rateLimitError,
              onRetry: options?.onRetry,
              toastId: 'rate-limit-notification',
            }),
            {
              duration: retryAfterSeconds ? (retryAfterSeconds + 5) * 1000 : Infinity,
              id: 'rate-limit-notification',
            }
          )
          // Return the message string for compatibility
          return rateLimitError.message
        }

        // Fallback to regular error toast if notification disabled
        toast.showError(rateLimitError.message)
        return rateLimitError.message
      }

      if (apiError?.error?.message) {
        toast.showError(apiError.error.message)
        return apiError.error.message
      }

      if (error.response) {
        const status = error.response.status
        const statusMessages: Record<number, string> = {
          400: 'Invalid request. Please check your input.',
          401: 'Authentication required. Please log in.',
          403: 'You do not have permission to perform this action.',
          404: 'The requested resource was not found.',
          500: 'Server error. Please try again later.',
          503: 'Service unavailable. Please try again later.',
        }

        toast.showError(statusMessages[status] || `Request failed with status ${status}`)
        return statusMessages[status] || `Request failed with status ${status}`
      }

      if (error.request) {
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          toast.showError(
            'Request timeout. The operation is taking longer than expected. Please try again or contact support if the issue persists.'
          )
          return 'Request timeout. The operation is taking longer than expected.'
        }
        toast.showError('Network error. Please check your connection and try again.')
        return 'Network error. Please check your connection and try again.'
      }
    }

    if (error instanceof Error) {
      toast.showError(error.message || defaultMessage || 'An error occurred')
      return error.message || defaultMessage || 'An error occurred'
    }

    toast.showError(defaultMessage || 'An unexpected error occurred')
    return defaultMessage || 'An unexpected error occurred'
  }

  return { handleError, isRateLimitError }
}
