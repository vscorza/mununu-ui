/**
 * Progress Indicator Component
 *
 * Shows progress for multi-step operations with step details
 */

import { LoadingSpinner } from './LoadingSpinner'
import './ProgressIndicator.css'

export interface ProgressStep {
  /** Step identifier */
  id: string
  /** Step label */
  label: string
  /** Step description */
  description?: string
  /** Whether this step is active */
  active?: boolean
  /** Whether this step is completed */
  completed?: boolean
  /** Whether this step has an error */
  error?: boolean
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
  /** Progress percentage (0-100) */
  progress?: number
}

interface ProgressIndicatorProps {
  /** Current step */
  currentStep?: string
  /** All steps */
  steps: ProgressStep[]
  /** Optional message */
  message?: string
  /** Show progress percentage */
  showProgress?: boolean
  /** Optional className */
  className?: string
}

export const ProgressIndicator = ({
  currentStep,
  steps,
  message,
  showProgress = true,
  className = '',
}: ProgressIndicatorProps) => {
  const completedSteps = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return (
    <div className={`progress-indicator ${className}`}>
      {message && <div className="progress-indicator-message">{message}</div>}

      {showProgress && (
        <div className="progress-indicator-bar-container">
          <div className="progress-indicator-bar">
            <div className="progress-indicator-bar-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <div className="progress-indicator-percentage">{Math.round(overallProgress)}%</div>
        </div>
      )}

      <div className="progress-indicator-steps">
        {steps.map((step, idx) => {
          const isActive = step.active || step.id === currentStep
          const isCompleted = step.completed
          const hasError = step.error

          return (
            <div
              key={step.id}
              className={`progress-indicator-step ${
                isActive ? 'active' : isCompleted ? 'completed' : hasError ? 'error' : 'pending'
              }`}
            >
              <div className="progress-indicator-step-icon">
                {hasError ? (
                  <span className="progress-indicator-step-icon-error">✕</span>
                ) : isCompleted ? (
                  <span className="progress-indicator-step-icon-completed">✓</span>
                ) : isActive ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <span className="progress-indicator-step-icon-pending">{idx + 1}</span>
                )}
              </div>
              <div className="progress-indicator-step-content">
                <div className="progress-indicator-step-label">{step.label}</div>
                {step.description && (
                  <div className="progress-indicator-step-description">{step.description}</div>
                )}
                {isActive && step.estimatedTimeRemaining !== undefined && (
                  <div className="progress-indicator-step-time">
                    Estimated time remaining: {formatTime(step.estimatedTimeRemaining)}
                  </div>
                )}
                {isActive && step.progress !== undefined && (
                  <div className="progress-indicator-step-progress">
                    <div className="progress-indicator-step-progress-bar">
                      <div
                        className="progress-indicator-step-progress-fill"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                    <span className="progress-indicator-step-progress-text">
                      {Math.round(step.progress)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
