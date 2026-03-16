import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// Import types (generated from OpenAPI)
import type { paths } from './types'
import { analytics } from '../services/analytics'
import { offlineQueue } from '../services/offlineQueue'

// Generate UUID v4 for correlation IDs
const generateCorrelationId = (): string => {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Map to store request start times (using request URL + method as key)
const requestStartTimes = new Map<string, number>()

// Create axios instance for regular endpoints
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json; charset=utf-8',
  },
  timeout: 10000, // 10 second timeout
  responseType: 'json',
  responseEncoding: 'utf8',
})

// Create axios instance for AI endpoints with extended timeout
// AI operations (summarization, event logs, IR extraction) can take 30-120 seconds
// This client should be used for all AI-powered endpoints that may require longer processing times
export const aiApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json; charset=utf-8',
  },
  timeout: 120000, // 120 seconds (2 minutes) timeout for AI operations
  responseType: 'json',
  responseEncoding: 'utf8',
})

// Request interceptor to track start time and add correlation ID
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  // Generate correlation ID if not present
  if (!config.headers['X-Correlation-ID']) {
    config.headers['X-Correlation-ID'] = generateCorrelationId()
  }
  // Store start time using URL + method as key
  const key = `${config.method || 'get'}_${config.url || 'unknown'}`
  requestStartTimes.set(key, performance.now())
  return config
}

// Response interceptor for success tracking
const successInterceptor = (response: AxiosResponse) => {
  const config = response.config
  const key = `${config.method || 'get'}_${config.url || 'unknown'}`
  const startTime = requestStartTimes.get(key)
  const duration = startTime ? performance.now() - startTime : 0
  requestStartTimes.delete(key) // Clean up

  // Extract endpoint from URL
  const endpoint = config.url || 'unknown'
  const method = (config.method || 'get').toUpperCase()

  // Extract correlation ID from response headers (if present)
  const correlationId = response.headers['x-correlation-id'] || config.headers['X-Correlation-ID']
  if (correlationId && import.meta.env.DEV) {
    console.log(`[API] ${method} ${endpoint} - Correlation ID: ${correlationId}`)
  }

  // Track successful API call
  analytics.trackApiCall({
    endpoint,
    method,
    statusCode: response.status,
    duration,
    success: true,
  })

  // Attach correlation ID to response for access in components
  ;(response as AxiosResponse & { correlationId?: string }).correlationId = correlationId as
    | string
    | undefined

  return response
}

// Response interceptor for error handling and tracking
const errorInterceptor = (error: AxiosError) => {
  const config = error.config
  const key = config ? `${config.method || 'get'}_${config.url || 'unknown'}` : 'unknown'
  const startTime = requestStartTimes.get(key)
  const duration = startTime ? performance.now() - startTime : 0
  requestStartTimes.delete(key) // Clean up

  // Extract endpoint from URL
  const endpoint = config?.url || 'unknown'
  const method = (config?.method || 'get').toUpperCase()

  let errorType = 'unknown'
  let errorMessage = error.message

  if (error.response) {
    // Handle API errors
    const apiError = error.response.data as
      | { error?: { message: string; code: string } }
      | undefined
    errorType = 'api_error'
    errorMessage = apiError?.error?.message || error.message

    // Log error to analytics
    analytics.logError(
      errorMessage,
      'API Client',
      'error',
      {
        endpoint,
        method,
        statusCode: error.response.status,
        errorCode: apiError?.error?.code,
      },
      error.stack
    )

    // Track failed API call
    analytics.trackApiCall({
      endpoint,
      method,
      statusCode: error.response.status,
      duration,
      success: false,
      errorType,
      errorMessage,
    })
  } else if (error.request) {
    errorType = error.code === 'ECONNABORTED' ? 'timeout' : 'network_error'
    errorMessage =
      error.code === 'ECONNABORTED'
        ? 'Request Timeout: The request took too long to complete'
        : 'Network Error: Could not connect to API server'

    // Queue the request for offline retry (only for network errors, not timeouts)
    if (error.code !== 'ECONNABORTED' && config && !navigator.onLine) {
      try {
        offlineQueue.enqueue({
          type: 'api',
          endpoint: config.url || endpoint,
          method: method,
          payload: config.data,
          maxRetries: 3,
        })
        console.log('[API Client] Request queued for offline retry:', endpoint)
      } catch (queueError) {
        console.warn('[API Client] Failed to queue request:', queueError)
      }
    }

    // Log error to analytics
    analytics.logError(
      errorMessage,
      'API Client',
      'error',
      {
        endpoint,
        method,
        errorCode: error.code,
      },
      error.stack
    )

    // Track failed API call
    analytics.trackApiCall({
      endpoint,
      method,
      duration,
      success: false,
      errorType,
      errorMessage,
    })
  } else {
    errorType = 'request_error'
    errorMessage = error.message

    // Log error to analytics
    analytics.logError(
      errorMessage,
      'API Client',
      'error',
      {
        endpoint,
        method,
      },
      error.stack
    )

    // Track failed API call
    analytics.trackApiCall({
      endpoint,
      method,
      duration,
      success: false,
      errorType,
      errorMessage,
    })
  }

  return Promise.reject(error)
}

// Apply interceptors to both clients
apiClient.interceptors.request.use(requestInterceptor)
apiClient.interceptors.response.use(successInterceptor, errorInterceptor)

aiApiClient.interceptors.request.use(requestInterceptor)
aiApiClient.interceptors.response.use(successInterceptor, errorInterceptor)

// Health check
export const healthCheck = async (): Promise<{ status: string; service: string }> => {
  const response =
    await apiClient.get<
      paths['/api/v1/health']['get']['responses']['200']['content']['application/json']
    >('/health')
  return response.data as { status: string; service: string }
}
