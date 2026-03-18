import { useState, useCallback } from 'react'
import {
  verifyContext,
  type ContextVerifyResponse,
  type FormulaVerificationResult,
} from '../api/endpoints'
import { useToast } from './useToast'
import { useErrorHandler } from './useErrorHandler'
import { useRetry } from './useRetry'

export type { FormulaVerificationResult }

export interface VerificationState {
  result: ContextVerifyResponse | null
  isLoading: boolean
  error: string | null
}

export const useVerification = (initialState?: Partial<VerificationState>) => {
  const [state, setState] = useState<VerificationState>({
    result: initialState?.result ?? null,
    isLoading: initialState?.isLoading ?? false,
    error: initialState?.error ?? null,
  })
  const toast = useToast()
  const { handleError } = useErrorHandler()
  const { retry } = useRetry()

  const verify = useCallback(
    async (
      content: string,
      contextName?: string,
      formula?: string,
      automaton?: string
    ): Promise<void> => {
      if (!content.trim()) {
        toast.showError('Context content is required for verification')
        return Promise.reject(new Error('Context content is required'))
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await retry(
          () =>
            verifyContext({
              context: { name: contextName || 'editor.ctxdsl', content },
              formula: formula || undefined,
              automaton: automaton || undefined,
            }),
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (attempt, error) => {
              console.log(`Retrying verification (attempt ${attempt})`, error)
            },
          }
        )

        setState(prev => ({
          ...prev,
          result: response,
          isLoading: false,
          error: null,
        }))

        if (response.all_satisfied) {
          toast.showSuccess('All formulas satisfied')
        } else {
          const failed = response.results.filter(r => !r.satisfied).length
          toast.showInfo(`Verification completed — ${failed} formula(s) not satisfied`)
        }
      } catch (err) {
        const errorMessage = handleError(err)
        setState(prev => ({
          ...prev,
          result: null,
          isLoading: false,
          error: errorMessage,
        }))
        if (!errorMessage.includes('Rate limit exceeded')) {
          toast.showError(`Verification failed: ${errorMessage}`)
        }
      }
    },
    [toast, handleError, retry]
  )

  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    })
  }, [])

  return {
    state,
    verify,
    clearResult,
  }
}
