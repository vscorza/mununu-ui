import { useRef, useCallback } from 'react'

export const useRequestCancellation = () => {
  const abortControllerRef = useRef<AbortController | null>(null)

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const createAbortController = useCallback(() => {
    cancelRequest() // Cancel any existing request
    abortControllerRef.current = new AbortController()
    return abortControllerRef.current
  }, [cancelRequest])

  const getAbortSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController()
    }
    return abortControllerRef.current.signal
  }, [])

  return {
    cancelRequest,
    createAbortController,
    getAbortSignal,
  }
}
