import { useCallback, useRef, useState } from "react";
import {
  useExtractionStore,
  isStepAvailable,
  getStepStatus,
} from "../../store/extractionStore";
import { getWorkflow } from "../../types/workflow";
import type { WorkflowStep } from "../../types/workflow";
import { WorkflowStepper } from "./WorkflowStepper";
import { DomainSelector } from "./DomainSelector";
import { SidecarEditor } from "./SidecarEditor";

// ---------------------------------------------------------------------------
// File upload area (shared between domain selection and load step)
// ---------------------------------------------------------------------------

function FileUploadArea({ onFileLoad }: { onFileLoad: (content: string, name: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onFileLoad(reader.result, file.name);
        }
      };
      reader.readAsText(file);
    },
    [onFileLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed
        px-6 py-10 cursor-pointer transition-colors
        ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-gray-500"
        }
      `}
    >
      <svg
        className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Drop a source file here, or <span className="font-medium text-blue-600 dark:text-blue-400">browse</span>
      </p>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step content panels (placeholders for now)
// ---------------------------------------------------------------------------

function StepRunButton({
  step,
  disabled,
  onClick,
}: {
  step: WorkflowStep;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-md px-4 py-2 text-sm font-medium transition-colors
        ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
            : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        }
      `}
    >
      Run {step.label}
    </button>
  );
}

function LoadStepContent({ onFileLoad }: { onFileLoad: (content: string, name: string) => void }) {
  const { sourceContent, sourceFileName, additionalSources, addSource, removeSource } =
    useExtractionStore();
  const additionalInputRef = useRef<HTMLInputElement>(null);

  const handleAdditionalFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            addSource(file.name, reader.result);
          }
        };
        reader.readAsText(file);
      });
      e.target.value = "";
    },
    [addSource],
  );

  if (sourceContent) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Primary: <span className="font-medium text-gray-900 dark:text-gray-100">{sourceFileName}</span>
          </span>
        </div>
        <pre className="max-h-48 overflow-auto rounded-md bg-gray-100 p-3 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          {sourceContent.slice(0, 1500)}
          {sourceContent.length > 1500 && "\n... (truncated)"}
        </pre>

        {/* Additional sources section */}
        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Source Files
              <span className="ml-1 text-gray-400">
                ({additionalSources.length} file{additionalSources.length !== 1 ? "s" : ""})
              </span>
            </span>
            <button
              type="button"
              onClick={() => additionalInputRef.current?.click()}
              className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              + Add Files
            </button>
            <input
              ref={additionalInputRef}
              type="file"
              multiple
              accept=".sv,.v,.ts,.tsx,.py,.rs"
              onChange={handleAdditionalFiles}
              className="hidden"
            />
          </div>
          {additionalSources.length > 0 && (
            <ul className="mt-2 space-y-1">
              {additionalSources.map((src) => (
                <li
                  key={src.name}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-xs dark:bg-gray-800"
                >
                  <span className="text-gray-700 dark:text-gray-300">{src.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSource(src.name)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Remove"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
          {additionalSources.length === 0 && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              For multi-module designs, add sub-module source files here.
            </p>
          )}
        </div>
      </div>
    );
  }

  return <FileUploadArea onFileLoad={onFileLoad} />;
}

function StepContent({ step }: { step: WorkflowStep }) {
  const state = useExtractionStore();
  const available = isStepAvailable(state, step.id);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const runStep = useCallback(async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const stepResult = await executeStep(step.id, state);
      state.completeStep(step.id, { success: true, data: stepResult, timestamp: Date.now() });
      if (typeof stepResult === "string") {
        setResult(stepResult);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      state.completeStep(step.id, { success: false, error: msg, timestamp: Date.now() });
    } finally {
      setRunning(false);
    }
  }, [step.id, state]);

  // Sidecar editor step
  if (step.id === "edit_sidecar") {
    const sidecarExt = state.activeWorkflow?.sidecarExtension ?? ".json";
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
        {state.sidecarContent ? (
          <div className="h-80 rounded-md border border-gray-200 dark:border-gray-700">
            <SidecarEditor
              content={state.sidecarContent}
              onChange={state.updateSidecar}
              extension={sidecarExt}
            />
          </div>
        ) : (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            No sidecar generated yet. Complete the init/extract step first.
          </div>
        )}
      </div>
    );
  }

  // Verify step — prompt to switch tabs
  if (step.id === "verify") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {state.ctxdslContent
              ? "CTXDSL generated. Switch to the Verification tab to evaluate properties."
              : "Complete the Translate step first to generate CTXDSL."}
          </p>
        </div>
      </div>
    );
  }

  // Steps with API endpoints
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>

      <div className="flex items-center gap-3">
        <StepRunButton step={step} disabled={!available || running} onClick={runStep} />
        {running && (
          <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Running...
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
          {result}
        </div>
      )}
    </div>
  );
}

/**
 * Execute a workflow step by calling the appropriate API endpoint.
 * Returns a human-readable result message.
 */
async function executeStep(
  stepId: string,
  state: ReturnType<typeof useExtractionStore.getState>,
): Promise<string> {
  const {
    sourceContent,
    sourceFileName,
    additionalSources,
    sidecarContent,
    updateSidecar,
    updateCtxdsl,
  } = state;

  switch (stepId) {
    case "init": {
      const { svInit } = await import("../../api/endpoints");
      const response = await svInit({
        source: { name: sourceFileName, content: sourceContent },
        additional_sources: additionalSources.map((s) => ({
          name: s.name,
          content: s.content,
        })),
      });
      updateSidecar(response.sidecar);
      const sigCount = response.signals.length;
      const inpCount = response.inputs.length;
      return `Sidecar generated (${response.schema}): ${sigCount} signal(s), ${inpCount} input(s)`;
    }

    case "discover": {
      const { svDiscover } = await import("../../api/endpoints");
      if (!sidecarContent) throw new Error("No sidecar — run Init first");
      const response = await svDiscover({
        source: { name: sourceFileName, content: sourceContent },
        sidecar: sidecarContent,
      });
      if (!response.smt_available) {
        throw new Error(response.warnings.join("; ") || "SMT not available");
      }
      updateSidecar(response.sidecar);
      const totalFound = response.discoveries.reduce((s, d) => s + d.values_found, 0);
      return `Discovered ${totalFound} value(s) across ${response.discoveries.length} signal(s)`;
    }

    case "extract": {
      const { extractSource } = await import("../../api/endpoints");
      const response = await extractSource({
        source: sourceContent,
        config: "{}",
      });
      updateSidecar(response.espec);
      const autCount = response.automata.length;
      return `Extracted ${autCount} automaton/a. ${response.warnings.length} warning(s).`;
    }

    case "validate": {
      const { validateExtraction } = await import("../../api/endpoints");
      if (!sidecarContent) throw new Error("No spec — run Extract first");
      const response = await validateExtraction({
        spec: sidecarContent,
        source: sourceContent,
      });
      const s = response.summary;
      return `Anchors: ${s.exact} exact, ${s.drifted} drifted, ${s.mismatch} mismatch, ${s.error} error. ${s.uncovered_accesses} uncovered.`;
    }

    case "translate": {
      const { importContext } = await import("../../api/endpoints");
      const domain = state.activeWorkflow?.domain;
      const format = domain === "rtl" ? "systemverilog" : domain === "software" ? "extraction" : "auto";
      const content = format === "extraction" && sidecarContent ? sidecarContent : sourceContent;
      const response = await importContext({
        content,
        format,
        filename: sourceFileName,
        sidecar: format === "systemverilog" ? sidecarContent ?? undefined : undefined,
        additional_sources:
          format === "systemverilog"
            ? additionalSources.map((s) => ({ name: s.name, content: s.content }))
            : [],
      });
      updateCtxdsl(response.ctxdsl);
      return `Translated to CTXDSL (${response.source_format}): ${response.state_count} states, ${response.property_count} properties`;
    }

    default:
      throw new Error(`Unknown step: ${stepId}`);
  }
}

// ---------------------------------------------------------------------------
// Main ExtractionPanel
// ---------------------------------------------------------------------------

export const ExtractionPanel = () => {
  const state = useExtractionStore();
  const { activeWorkflow, currentStep, startWorkflow, resetWorkflow } = state;
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ content: string; name: string } | null>(null);

  const handleSelectDomain = useCallback(
    (domain: string) => {
      setSelectedDomain(domain);
      if (pendingFile) {
        const workflow = getWorkflow(domain);
        if (workflow) {
          startWorkflow(workflow, pendingFile.content, pendingFile.name);
          setPendingFile(null);
        }
      }
    },
    [pendingFile, startWorkflow],
  );

  const handleFileLoad = useCallback(
    (content: string, name: string) => {
      if (selectedDomain) {
        const workflow = getWorkflow(selectedDomain);
        if (workflow) {
          startWorkflow(workflow, content, name);
          return;
        }
      }
      setPendingFile({ content, name });
    },
    [selectedDomain, startWorkflow],
  );

  // ---- No workflow active: domain selection + file upload ----
  if (!activeWorkflow) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Extraction Domain
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a domain to begin the extraction workflow.
          </p>
        </div>

        <DomainSelector onSelectDomain={handleSelectDomain} selectedDomain={selectedDomain} />

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Source File</h3>
          <FileUploadArea onFileLoad={handleFileLoad} />
          {pendingFile && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              File ready: <span className="font-medium">{pendingFile.name}</span> — select a domain to start.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- Workflow active: stepper + step content ----
  const currentStepDef = activeWorkflow.steps.find((s) => s.id === currentStep);
  const status = currentStepDef ? getStepStatus(state, currentStepDef.id) : "pending";

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activeWorkflow.displayName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeWorkflow.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetWorkflow();
            setSelectedDomain(null);
            setPendingFile(null);
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Stepper */}
      <WorkflowStepper />

      {/* Step content */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        {currentStepDef && (
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              {currentStepDef.label}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                status === "completed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : status === "active"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : status === "skipped"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {status}
            </span>
          </div>
        )}

        {currentStepDef?.id === "load" ? (
          <LoadStepContent onFileLoad={handleFileLoad} />
        ) : currentStepDef ? (
          <StepContent step={currentStepDef} />
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No step selected.</p>
        )}
      </div>
    </div>
  );
};
