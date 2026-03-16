import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from './Button'
import type { RateLimitError } from '../../types/rateLimit'
import './RateLimitNotification.css'

interface RateLimitNotificationProps {
  error: RateLimitError
  onRetry?: () => void | Promise<void>
  toastId?: string
}

export const RateLimitNotification = ({ error, onRetry, toastId }: RateLimitNotificationProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(error.retryAfterSeconds)
  // Derive canRetry from timeRemaining instead of separate state to avoid setState in effect
  const canRetry = timeRemaining === null || timeRemaining <= 0

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) {
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  const handleRetry = useCallback(async () => {
    if (!canRetry || !onRetry) return

    // Dismiss this toast notification
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      // If no toastId provided, dismiss all rate limit notifications
      toast.dismiss('rate-limit-notification')
    }

    await onRetry()
  }, [canRetry, onRetry, toastId])

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return (
    <div className="rate-limit-notification">
      <div className="rate-limit-notification-header">
        <div className="rate-limit-notification-icon">⏱️</div>
        <div className="rate-limit-notification-content">
          <div className="rate-limit-notification-title">Rate Limit Exceeded</div>
          <div className="rate-limit-notification-message">{error.message}</div>
        </div>
      </div>
      {timeRemaining !== null && timeRemaining > 0 && (
        <div className="rate-limit-notification-countdown">
          <span className="rate-limit-notification-countdown-label">Retry in:</span>
          <span className="rate-limit-notification-countdown-time">
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}
      {onRetry && (
        <div className="rate-limit-notification-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRetry}
            disabled={!canRetry}
            className="rate-limit-notification-retry-button"
          >
            {canRetry
              ? 'Retry Now'
              : `Wait ${timeRemaining !== null ? formatTime(timeRemaining) : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}
