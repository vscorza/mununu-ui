import { useState, useCallback } from "react";
import {
  synthesizeContext,
  type SynthesizeResponse,
} from "../api/endpoints";
import { useToast } from "./useToast";
import { useErrorHandler } from "./useErrorHandler";
import { useRetry } from "./useRetry";

export interface SynthesisState {
  result: SynthesizeResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const useSynthesis = () => {
  const [state, setState] = useState<SynthesisState>({
    result: null,
    isLoading: false,
    error: null,
  });
  const toast = useToast();
  const { handleError } = useErrorHandler();
  const { retry } = useRetry();

  const synthesize = useCallback(
    async (
      content: string,
      formula: string,
      automaton: string,
      options?: {
        minimize?: boolean;
        counterexample?: boolean;
        deadlockTraces?: boolean;
        counterstrategy?: boolean;
      },
    ): Promise<void> => {
      if (!content.trim()) {
        toast.showError("Context content is required for synthesis");
        return;
      }
      if (!formula.trim()) {
        toast.showError("Formula name is required for synthesis");
        return;
      }
      if (!automaton.trim()) {
        toast.showError("Automaton name is required for synthesis");
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await retry(
          () =>
            synthesizeContext({
              context: { name: "editor.ctxdsl", content },
              formula,
              automaton,
              options: {
                minimize: options?.minimize,
                diagnostics: {
                  counterexample: options?.counterexample,
                  deadlock_traces: options?.deadlockTraces,
                  counterstrategy: options?.counterstrategy,
                },
              },
            }),
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (attempt, error) => {
              console.log(`Retrying synthesis (attempt ${attempt})`, error);
            },
          },
        );

        setState({
          result: response,
          isLoading: false,
          error: null,
        });

        if (response.realizable) {
          toast.showSuccess("Synthesis completed: realizable");
        } else {
          toast.showInfo("Synthesis completed: unrealizable");
        }
      } catch (err) {
        const errorMessage = handleError(err);
        setState({
          result: null,
          isLoading: false,
          error: errorMessage,
        });
        if (!errorMessage.includes("Rate limit exceeded")) {
          toast.showError(`Synthesis failed: ${errorMessage}`);
        }
      }
    },
    [toast, handleError, retry],
  );

  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    state,
    synthesize,
    clearResult,
  };
};
