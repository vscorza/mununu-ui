/**
 * Analytics and Monitoring Service
 * Tracks API calls, performance metrics, errors, and user interactions
 */

export interface ApiCallMetric {
  endpoint: string
  method: string
  statusCode?: number
  duration: number
  timestamp: number
  success: boolean
  errorType?: string
  errorMessage?: string
}

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface ErrorLog {
  message: string
  stack?: string
  timestamp: number
  context?: Record<string, unknown>
  severity: 'error' | 'warning' | 'info'
  source: string
}

export interface AnalyticsData {
  apiCalls: ApiCallMetric[]
  performance: PerformanceMetric[]
  errors: ErrorLog[]
  userActions: Array<{
    action: string
    timestamp: number
    metadata?: Record<string, unknown>
  }>
}

class AnalyticsService {
  private apiCalls: ApiCallMetric[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private errorLogs: ErrorLog[] = []
  private userActions: AnalyticsData['userActions'] = []
  private maxEntries = 1000 // Limit stored entries to prevent memory issues

  /**
   * Track an API call
   */
  trackApiCall(metric: Omit<ApiCallMetric, 'timestamp'>): void {
    const fullMetric: ApiCallMetric = {
      ...metric,
      timestamp: Date.now(),
    }

    this.apiCalls.push(fullMetric)

    // Keep only recent entries
    if (this.apiCalls.length > this.maxEntries) {
      this.apiCalls = this.apiCalls.slice(-this.maxEntries)
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const status = metric.success ? '✅' : '❌'
      console.log(
        `[Analytics] ${status} ${metric.method} ${metric.endpoint} - ${metric.duration.toFixed(2)}ms`,
        metric.statusCode ? `(${metric.statusCode})` : ''
      )
    }
  }

  /**
   * Track a performance metric
   */
  trackPerformance(name: string, duration: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    this.performanceMetrics.push(metric)

    // Keep only recent entries
    if (this.performanceMetrics.length > this.maxEntries) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxEntries)
    }

    // Log slow operations in development
    if (import.meta.env.DEV && duration > 100) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`, metadata)
    }
  }

  /**
   * Log an error
   */
  logError(
    message: string,
    source: string,
    severity: ErrorLog['severity'] = 'error',
    context?: Record<string, unknown>,
    stack?: string
  ): void {
    const errorLog: ErrorLog = {
      message,
      stack,
      timestamp: Date.now(),
      context,
      severity,
      source,
    }

    this.errorLogs.push(errorLog)

    // Keep only recent entries
    if (this.errorLogs.length > this.maxEntries) {
      this.errorLogs = this.errorLogs.slice(-this.maxEntries)
    }

    // Log to console
    const emoji = severity === 'error' ? '🔴' : severity === 'warning' ? '🟡' : '🔵'
    console[severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'log'](
      `[${emoji} Analytics] ${source}: ${message}`,
      context || ''
    )
  }

  /**
   * Track a user action
   */
  trackUserAction(action: string, metadata?: Record<string, unknown>): void {
    this.userActions.push({
      action,
      timestamp: Date.now(),
      metadata,
    })

    // Keep only recent entries
    if (this.userActions.length > this.maxEntries) {
      this.userActions = this.userActions.slice(-this.maxEntries)
    }
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalApiCalls: number
    successfulApiCalls: number
    failedApiCalls: number
    averageApiCallDuration: number
    totalErrors: number
    totalWarnings: number
    totalUserActions: number
    recentApiCalls: ApiCallMetric[]
    recentErrors: ErrorLog[]
    slowOperations: PerformanceMetric[]
  } {
    const successfulApiCalls = this.apiCalls.filter(call => call.success).length
    const failedApiCalls = this.apiCalls.filter(call => !call.success).length
    const totalDuration = this.apiCalls.reduce((sum, call) => sum + call.duration, 0)
    const averageDuration = this.apiCalls.length > 0 ? totalDuration / this.apiCalls.length : 0

    const errors = this.errorLogs.filter(log => log.severity === 'error').length
    const warnings = this.errorLogs.filter(log => log.severity === 'warning').length

    const slowOperations = this.performanceMetrics
      .filter(metric => metric.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    return {
      totalApiCalls: this.apiCalls.length,
      successfulApiCalls,
      failedApiCalls,
      averageApiCallDuration: averageDuration,
      totalErrors: errors,
      totalWarnings: warnings,
      totalUserActions: this.userActions.length,
      recentApiCalls: this.apiCalls.slice(-20),
      recentErrors: this.errorLogs.slice(-20),
      slowOperations,
    }
  }

  /**
   * Get all analytics data
   */
  getAllData(): AnalyticsData {
    return {
      apiCalls: [...this.apiCalls],
      performance: [...this.performanceMetrics],
      errors: [...this.errorLogs],
      userActions: [...this.userActions],
    }
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.apiCalls = []
    this.performanceMetrics = []
    this.errorLogs = []
    this.userActions = []
  }

  /**
   * Export analytics data as JSON
   */
  export(): string {
    return JSON.stringify(this.getAllData(), null, 2)
  }
}

// Singleton instance
export const analytics = new AnalyticsService()

// Make available globally in development for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).analytics = analytics
}
