/**
 * Hook for preventing duplicate API requests
 * Tracks in-flight requests and cancels duplicates
 */

import { useRef, useCallback } from 'react'

interface RequestTracker {
  key: string
  controller: AbortController
  timestamp: number
}

export const useRequestDeduplication = () => {
  const activeRequests = useRef<Map<string, RequestTracker>>(new Map())

  const createRequestKey = useCallback((endpoint: string, params: unknown): string => {
    // Create a unique key from endpoint and serialized params
    const paramsStr = JSON.stringify(params, Object.keys(params as Record<string, unknown>).sort())
    return `${endpoint}:${paramsStr}`
  }, [])

  const isRequestInFlight = useCallback((key: string): boolean => {
    const tracker = activeRequests.current.get(key)
    if (!tracker) return false

    // Clean up stale requests (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (tracker.timestamp < fiveMinutesAgo) {
      activeRequests.current.delete(key)
      return false
    }

    return true
  }, [])

  const startRequest = useCallback((key: string): AbortController => {
    // Cancel existing request with same key
    const existing = activeRequests.current.get(key)
    if (existing) {
      existing.controller.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    activeRequests.current.set(key, {
      key,
      controller,
      timestamp: Date.now(),
    })

    return controller
  }, [])

  const finishRequest = useCallback((key: string): void => {
    activeRequests.current.delete(key)
  }, [])

  const cancelRequest = useCallback((key: string): void => {
    const tracker = activeRequests.current.get(key)
    if (tracker) {
      tracker.controller.abort()
      activeRequests.current.delete(key)
    }
  }, [])

  const cancelAllRequests = useCallback((): void => {
    activeRequests.current.forEach(tracker => {
      tracker.controller.abort()
    })
    activeRequests.current.clear()
  }, [])

  return {
    createRequestKey,
    isRequestInFlight,
    startRequest,
    finishRequest,
    cancelRequest,
    cancelAllRequests,
  }
}
