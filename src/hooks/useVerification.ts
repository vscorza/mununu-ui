import { useState, useCallback } from "react";
import {
  verifyContext,
  synthesizeContext,
  type ContextVerifyResponse,
  type FormulaVerificationResult,
  type SynthesizeResponse,
} from "../api/endpoints";
import { useToast } from "./useToast";
import { useErrorHandler } from "./useErrorHandler";
import { useRetry } from "./useRetry";
import type { components } from "../api/types";

export type { FormulaVerificationResult };

type SynthesisDiagnostics = components["schemas"]["SynthesisDiagnostics"];

export interface DiagnosisResult {
  realizable: boolean;
  diagnostics: SynthesisDiagnostics;
}

export interface VerificationState {
  result: ContextVerifyResponse | null;
  isLoading: boolean;
  error: string | null;
}

export const useVerification = (initialState?: Partial<VerificationState>) => {
  const [state, setState] = useState<VerificationState>({
    result: initialState?.result ?? null,
    isLoading: initialState?.isLoading ?? false,
    error: initialState?.error ?? null,
  });
  const [diagnosisResults, setDiagnosisResults] = useState<
    Map<string, DiagnosisResult>
  >(new Map());
  const [diagnosingKeys, setDiagnosingKeys] = useState<Set<string>>(
    new Set(),
  );
  const toast = useToast();
  const { handleError } = useErrorHandler();
  const { retry } = useRetry();

  const verify = useCallback(
    async (
      content: string,
      contextName?: string,
      formula?: string,
      automaton?: string,
    ): Promise<void> => {
      if (!content.trim()) {
        toast.showError("Context content is required for verification");
        return Promise.reject(new Error("Context content is required"));
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      setDiagnosisResults(new Map());
      setDiagnosingKeys(new Set());

      try {
        const response = await retry(
          () =>
            verifyContext({
              context: { name: contextName || "editor.ctxdsl", content },
              formula: formula || undefined,
              automaton: automaton || undefined,
            }),
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (attempt, error) => {
              console.log(`Retrying verification (attempt ${attempt})`, error);
            },
          },
        );

        setState((prev) => ({
          ...prev,
          result: response,
          isLoading: false,
          error: null,
        }));

        if (response.all_satisfied) {
          toast.showSuccess("All formulas satisfied");
        } else {
          const failed = response.results.filter((r) => !r.satisfied).length;
          toast.showInfo(
            `Verification completed — ${failed} formula(s) not satisfied`,
          );
        }
      } catch (err) {
        const errorMessage = handleError(err);
        setState((prev) => ({
          ...prev,
          result: null,
          isLoading: false,
          error: errorMessage,
        }));
        if (!errorMessage.includes("Rate limit exceeded")) {
          toast.showError(`Verification failed: ${errorMessage}`);
        }
      }
    },
    [toast, handleError, retry],
  );

  const diagnoseFormula = useCallback(
    async (
      content: string,
      formulaName: string,
      automatonName: string,
      contextName?: string,
    ): Promise<void> => {
      const key = `${formulaName}:${automatonName}`;
      setDiagnosingKeys((prev) => new Set(prev).add(key));

      try {
        const response: SynthesizeResponse = await synthesizeContext({
          context: { name: contextName || "editor.ctxdsl", content },
          formula: formulaName,
          automaton: automatonName,
          options: {
            minimize: false,
            diagnostics: {
              counterexample: true,
              deadlock_traces: true,
            },
          },
        });

        setDiagnosisResults((prev) => {
          const next = new Map(prev);
          next.set(key, {
            realizable: response.realizable,
            diagnostics: response.diagnostics,
          });
          return next;
        });
      } catch (err) {
        const errorMessage = handleError(err);
        toast.showError(`Diagnosis failed: ${errorMessage}`);
      } finally {
        setDiagnosingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [handleError, toast],
  );

  const getDiagnosis = useCallback(
    (formulaName: string, automatonName: string): DiagnosisResult | null => {
      return diagnosisResults.get(`${formulaName}:${automatonName}`) ?? null;
    },
    [diagnosisResults],
  );

  const isDiagnosing = useCallback(
    (formulaName: string, automatonName: string): boolean => {
      return diagnosingKeys.has(`${formulaName}:${automatonName}`);
    },
    [diagnosingKeys],
  );

  const clearResult = useCallback(() => {
    setState({
      result: null,
      isLoading: false,
      error: null,
    });
    setDiagnosisResults(new Map());
    setDiagnosingKeys(new Set());
  }, []);

  return {
    state,
    verify,
    diagnoseFormula,
    getDiagnosis,
    isDiagnosing,
    clearResult,
  };
};
