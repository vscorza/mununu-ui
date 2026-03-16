import { useState, useCallback } from 'react'
import { synthesizeController } from '../api/endpoints'
import { useToast } from './useToast'
import { useErrorHandler } from './useErrorHandler'
import type { paths } from '../api/types'

type ContextSynthesizeResponse =
  paths['/api/v1/context/synthesize']['post']['responses']['200']['content']['application/json']

export interface SynthesisState {
  result: ContextSynthesizeResponse | null
  isLoading: boolean
  lastSynthesized?: Date
  error?: string
  selectedTraceIndex: number
  selectedTraceStep: number
}

export const useSynthesis = () => {
  const [state, setState] = useState<SynthesisState>({
    result: null,
    isLoading: false,
    selectedTraceIndex: 0,
    selectedTraceStep: 0,
  })
  const toast = useToast()
  const { handleError } = useErrorHandler()

  const synthesize = useCallback(
    async (
      context: string,
      automaton: string,
      formula: string,
      contextName?: string,
      options?: { minimize?: boolean; diagnostics?: boolean },
      sidecars: Array<{ name: string; content: string }> = []
    ) => {
      if (!context.trim()) {
        toast.showError('Cannot synthesize from empty context')
        return
      }
      if (!automaton.trim()) {
        toast.showError('Please specify an automaton')
        return
      }
      if (!formula.trim()) {
        toast.showError('Please specify a formula')
        return
      }

      setState(prev => ({ ...prev, isLoading: true, error: undefined }))

      try {
        const response = await synthesizeController({
          context: {
            name: contextName || 'untitled.ctxdsl',
            content: context,
          },
          automaton,
          formula,
          options: {
            minimize: options?.minimize,
            diagnostics: options?.diagnostics
              ? {
                  counterexample: true,
                  counterstrategy: true,
                  deadlock_traces: true,
                }
              : undefined,
          },
          sidecars: sidecars.map(sc => ({ name: sc.name, content: sc.content })),
        })

        setState({
          result: response,
          isLoading: false,
          lastSynthesized: new Date(),
          error: undefined,
          selectedTraceIndex: 0,
          selectedTraceStep: 0,
        })

        if (response.realizable) {
          toast.showSuccess('Controller synthesis successful')
        } else {
          toast.showInfo('Controller synthesis failed - check diagnostics')
        }
      } catch (error) {
        const errorMessage = handleError(error)
        setState(prev => ({
          ...prev,
          result: null,
          isLoading: false,
          error: errorMessage,
        }))
        toast.showError(`Synthesis failed: ${errorMessage}`)
      }
    },
    [toast, handleError]
  )

  const setSelectedTraceIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, selectedTraceIndex: index, selectedTraceStep: 0 }))
  }, [])

  const setSelectedTraceStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, selectedTraceStep: step }))
  }, [])

  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: undefined,
      selectedTraceIndex: 0,
      selectedTraceStep: 0,
    })
  }, [])

  return {
    state,
    synthesize,
    setSelectedTraceIndex,
    setSelectedTraceStep,
    clearResult,
  }
}
