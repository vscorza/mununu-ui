/**
 * Extraction workflow state management (Zustand).
 *
 * Tracks the active workflow, current step, artifacts (source, sidecar, CTXDSL),
 * and step results. Used by ExtractionPanel and its sub-components.
 */

import { create } from "zustand";
import type { WorkflowDefinition } from "../types/workflow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepStatus = "pending" | "active" | "completed" | "skipped";

export interface StepResult {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
}

/** A named source file (primary or additional). */
export interface SourceFile {
  name: string;
  content: string;
}

export interface ExtractionState {
  /** Currently active workflow definition, or null if none selected. */
  activeWorkflow: WorkflowDefinition | null;
  /** Current step ID within the workflow. */
  currentStep: string;
  /** Set of completed step IDs. */
  completedSteps: Set<string>;
  /** Set of skipped step IDs. */
  skippedSteps: Set<string>;
  /** Results from each step execution (step ID -> result). */
  stepResults: Map<string, StepResult>;

  // Artifacts produced during the workflow
  /** Primary source file content. */
  sourceContent: string;
  /** Primary source file name. */
  sourceFileName: string;
  /** Additional source files (for multi-module SV, multi-file extraction). */
  additionalSources: SourceFile[];
  /** Sidecar content (.mununu.json or .espec.json), or null if not yet generated. */
  sidecarContent: string | null;
  /** Generated CTXDSL content, or null if not yet translated. */
  ctxdslContent: string | null;
  /**
   * Compositional-extraction config block as a JSON string. Authored in
   * the `compose` workflow step and merged into the extract config when
   * re-running extraction. Null when the user hasn't opened the compose
   * step yet (single-class verification path).
   *
   * Shape mirrors the backend's `composition` config field:
   * `{type, name, instances: [{of, as}], shared: [...]}`.
   */
  compositionConfig: string | null;

  // Actions
  startWorkflow: (workflow: WorkflowDefinition, source: string, fileName: string) => void;
  replaceSource: (content: string, fileName: string) => void;
  addSource: (name: string, content: string) => void;
  removeSource: (name: string) => void;
  completeStep: (stepId: string, result: StepResult) => void;
  skipStep: (stepId: string) => void;
  goToStep: (stepId: string) => void;
  updateSidecar: (content: string) => void;
  updateCtxdsl: (content: string) => void;
  /** Update the compositional-extraction config (raw JSON string). */
  updateCompositionConfig: (content: string) => void;
  resetWorkflow: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
  activeWorkflow: null as WorkflowDefinition | null,
  currentStep: "",
  completedSteps: new Set<string>(),
  skippedSteps: new Set<string>(),
  stepResults: new Map<string, StepResult>(),
  sourceContent: "",
  sourceFileName: "",
  additionalSources: [] as SourceFile[],
  sidecarContent: null as string | null,
  ctxdslContent: null as string | null,
  compositionConfig: null as string | null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useExtractionStore = create<ExtractionState>((set) => ({
  ...initialState,

  startWorkflow: (workflow, source, fileName) => {
    const firstStep = workflow.steps[0];
    set({
      activeWorkflow: workflow,
      currentStep: firstStep?.id ?? "",
      completedSteps: new Set(),
      skippedSteps: new Set(),
      stepResults: new Map(),
      sourceContent: source,
      sourceFileName: fileName,
      additionalSources: [],
      sidecarContent: null,
      ctxdslContent: null,
      compositionConfig: null,
    });
  },

  replaceSource: (content, fileName) =>
    set({ sourceContent: content, sourceFileName: fileName }),

  addSource: (name, content) =>
    set((state) => ({
      additionalSources: [
        ...state.additionalSources.filter((s) => s.name !== name),
        { name, content },
      ],
    })),

  removeSource: (name) =>
    set((state) => ({
      additionalSources: state.additionalSources.filter((s) => s.name !== name),
    })),

  completeStep: (stepId, result) =>
    set((state) => {
      const completed = new Set(state.completedSteps);
      completed.add(stepId);

      const results = new Map(state.stepResults);
      results.set(stepId, result);

      // Auto-advance to next uncompleted step
      let nextStep = state.currentStep;
      if (state.activeWorkflow) {
        const currentIdx = state.activeWorkflow.steps.findIndex(
          (s) => s.id === stepId,
        );
        if (currentIdx >= 0) {
          for (
            let i = currentIdx + 1;
            i < state.activeWorkflow.steps.length;
            i++
          ) {
            const step = state.activeWorkflow.steps[i];
            if (!completed.has(step.id) && !state.skippedSteps.has(step.id)) {
              nextStep = step.id;
              break;
            }
          }
        }
      }

      return {
        completedSteps: completed,
        stepResults: results,
        currentStep: nextStep,
      };
    }),

  skipStep: (stepId) =>
    set((state) => {
      const skipped = new Set(state.skippedSteps);
      skipped.add(stepId);
      return { skippedSteps: skipped };
    }),

  goToStep: (stepId) =>
    set({ currentStep: stepId }),

  updateSidecar: (content) =>
    set({ sidecarContent: content }),

  updateCtxdsl: (content) =>
    set({ ctxdslContent: content }),

  updateCompositionConfig: (content) =>
    set({ compositionConfig: content }),

  resetWorkflow: () =>
    set({ ...initialState }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/**
 * Check if a step's prerequisites are met.
 */
export function isStepAvailable(
  state: ExtractionState,
  stepId: string,
): boolean {
  if (!state.activeWorkflow) return false;
  // The current step is always available
  if (state.currentStep === stepId) return true;
  const step = state.activeWorkflow.steps.find((s) => s.id === stepId);
  if (!step) return false;
  return step.requires.every(
    (req) => state.completedSteps.has(req) || state.skippedSteps.has(req),
  );
}

/**
 * Get the status of a step.
 */
export function getStepStatus(
  state: ExtractionState,
  stepId: string,
): StepStatus {
  if (state.completedSteps.has(stepId)) return "completed";
  if (state.skippedSteps.has(stepId)) return "skipped";
  if (state.currentStep === stepId) return "active";
  return "pending";
}
