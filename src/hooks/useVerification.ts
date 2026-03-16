import { useState, useCallback } from 'react'
import {
  verifyStructural,
  verifyBehavioral,
  verifyAll,
  verifyBusiness as verifyBusinessApi,
  type BusinessVerificationRequest,
  type BusinessVerificationResult,
} from '../api/endpoints'
import { useToast } from './useToast'
import { useErrorHandler } from './useErrorHandler'
import { useRetry } from './useRetry'
import type { paths } from '../api/types'

type VerificationRequest =
  paths['/api/v1/bpm/verify/structural']['post']['requestBody']['content']['application/json']
export type VerificationResponse =
  paths['/api/v1/bpm/verify/structural']['post']['responses']['200']['content']['application/json']

export type VerificationType = 'structural' | 'behavioral' | 'all' | 'business'

export interface VerificationState {
  result: VerificationResponse | null
  businessResult: BusinessVerificationResult | null
  isLoading: boolean
  isBusinessLoading: boolean
  error: string | null
  businessError: string | null
  verificationType: VerificationType | null
}

export const useVerification = (initialState?: Partial<VerificationState>) => {
  const [state, setState] = useState<VerificationState>({
    result: initialState?.result ?? null,
    businessResult: initialState?.businessResult ?? null,
    isLoading: initialState?.isLoading ?? false,
    isBusinessLoading: initialState?.isBusinessLoading ?? false,
    error: initialState?.error ?? null,
    businessError: initialState?.businessError ?? null,
    verificationType: initialState?.verificationType ?? null,
  })
  const toast = useToast()
  const { handleError } = useErrorHandler()
  const { retry } = useRetry()

  const verify = useCallback(
    async (request: VerificationRequest, type: VerificationType = 'all'): Promise<void> => {
      if (!request.bpmn || !request.bpmn.content) {
        toast.showError('BPMN content is required for verification')
        return Promise.reject(new Error('BPMN content is required'))
      }

      setState(prev => ({ ...prev, isLoading: true, error: null, verificationType: type }))

      try {
        let response: VerificationResponse

        // Use retry logic for verification calls
        switch (type) {
          case 'structural':
            response = await retry(() => verifyStructural(request), {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (attempt, error) => {
                console.log(`Retrying structural verification (attempt ${attempt})`, error)
              },
            })
            break
          case 'behavioral':
            response = await retry(() => verifyBehavioral(request), {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (attempt, error) => {
                console.log(`Retrying behavioral verification (attempt ${attempt})`, error)
              },
            })
            break
          case 'all':
          default:
            response = await retry(() => verifyAll(request), {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (attempt, error) => {
                console.log(`Retrying verification (attempt ${attempt})`, error)
              },
            })
            break
        }

        setState(prev => ({
          ...prev,
          result: response,
          isLoading: false,
          error: null,
          verificationType: type,
        }))

        if (response.success) {
          const structuralPassed = !response.structural || response.structural.all_passed
          const behavioralSatisfied = !response.behavioral || response.behavioral.all_satisfied

          if (structuralPassed && behavioralSatisfied) {
            toast.showSuccess('All verification checks passed')
          } else {
            toast.showInfo('Verification completed with issues - see details')
          }
        } else {
          toast.showError('Verification failed')
        }
      } catch (err) {
        const errorMessage = handleError(err)
        setState(prev => ({
          ...prev,
          result: null,
          isLoading: false,
          error: errorMessage,
          verificationType: type,
        }))
        // Don't show duplicate error toast if rate limit notification is shown
        if (!errorMessage.includes('Rate limit exceeded')) {
          toast.showError(`Verification failed: ${errorMessage}`)
        }
      }
    },
    [toast, handleError, retry]
  )

  const verifyBusiness = useCallback(
    async (request: BusinessVerificationRequest) => {
      if (!request.bpmn || !request.bpmn.content) {
        toast.showError('BPMN content is required for business verification')
        return
      }

      setState(prev => ({ ...prev, isBusinessLoading: true, businessError: null }))

      try {
        // Use retry logic for business verification
        const response = await retry(() => verifyBusinessApi(request), {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(`Retrying business verification (attempt ${attempt})`, error)
          },
        })

        setState(prev => ({
          ...prev,
          businessResult: response,
          isBusinessLoading: false,
          businessError: null,
        }))

        const isCompliant = response.compliant
        if (isCompliant !== undefined) {
          if (isCompliant) {
            toast.showSuccess('Business verification passed')
          } else {
            toast.showInfo('Business verification completed - see details')
          }
        } else {
          toast.showSuccess('Business verification completed')
        }
      } catch (err) {
        const errorMessage = handleError(err)
        setState(prev => ({
          ...prev,
          businessResult: null,
          isBusinessLoading: false,
          businessError: errorMessage,
        }))
        // Don't show duplicate error toast if rate limit notification is shown
        if (!errorMessage.includes('Rate limit exceeded')) {
          toast.showError(`Business verification failed: ${errorMessage}`)
        }
      }
    },
    [toast, handleError, retry]
  )

  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      businessResult: null,
      isLoading: false,
      isBusinessLoading: false,
      error: null,
      businessError: null,
      verificationType: null,
    }))
  }, [])

  return {
    state,
    verify,
    verifyBusiness,
    clearResult,
    setState,
  }
}
