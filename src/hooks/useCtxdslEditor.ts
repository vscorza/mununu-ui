import { useState, useCallback, useRef } from "react";
import * as monaco from "monaco-editor";
import {
  summarizeContext,
  importContext,
  ADAPTER_EXTENSIONS,
  type TransitionObservation,
} from "../api/endpoints";
import { useToast } from "./useToast";
import { useErrorHandler } from "./useErrorHandler";

/** Metadata about an imported adapter format file. */
export interface ImportSource {
  originalFileName: string;
  originalContent: string;
  sourceFormat: string;
  warnings: string[];
  signalCount: number;
  stateCount: number;
  propertyCount: number;
  /**
   * Per-state structured valuations from the adapter (Moore output
   * values, register cells). Used by the trace renderer to enrich
   * counterexample / counterstrategy steps with concrete signal values.
   */
  stateValuations?: Record<
    string,
    Record<string, Record<string, string>>
  >;
  /**
   * Per-transition Mealy observations from the adapter. The trace
   * renderer matches each (source, target) hop to display
   * input-dependent output values per cycle.
   */
  transitionObservations?: Record<string, TransitionObservation[]>;
}

export interface CtxdslEditorState {
  content: string;
  fileName: string;
  isDirty: boolean;
  lastValidated?: Date;
  validationResult?: {
    success: boolean;
    summary?: {
      context_name: string;
      automata: Array<{
        name: string;
        states_count: number;
        transitions_count: number;
      }>;
      formulas_count: number;
      controllers_count: number;
    };
    error?: string;
  };
  /** Tracks the original imported file when an adapter format was loaded. */
  importSource?: ImportSource;
}

export const useCtxdslEditor = () => {
  const [state, setState] = useState<CtxdslEditorState>({
    content: "",
    fileName: "untitled.ctxdsl",
    isDirty: false,
  });
  const [isValidating, setIsValidating] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const toast = useToast();
  const { handleError } = useErrorHandler();

  const setContent = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      content,
      isDirty: true,
    }));
  }, []);

  const setFileName = useCallback((fileName: string) => {
    setState((prev) => ({
      ...prev,
      fileName,
    }));
  }, []);

  const newFile = useCallback(() => {
    setState({
      content: "",
      fileName: "untitled.ctxdsl",
      isDirty: false,
      lastValidated: undefined,
      validationResult: undefined,
      importSource: undefined,
    });
    editorRef.current?.setValue("");
  }, []);

  const loadFile = useCallback(
    async (
      content: string,
      fileName: string,
      svFrontend: "hand" | "yosys" = "hand",
    ) => {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";

      // If the file is an adapter format, translate it via the import endpoint.
      // For SystemVerilog (.sv/.v), respect the user's frontend choice — Phase 1
      // adds a Yosys-driven path alongside the original hand-written adapter.
      if (ADAPTER_EXTENSIONS.includes(ext) && ext !== "txt") {
        const isSvFile = ext === "sv" || ext === "v";
        const format =
          isSvFile && svFrontend === "yosys" ? "sv-yosys" : "auto";
        try {
          const response = await importContext({
            content,
            format,
            filename: fileName,
          });

          if (response.warnings.length > 0) {
            toast.showInfo(
              `Imported ${response.source_format}: ${response.warnings.join("; ")}`,
            );
          } else {
            toast.showSuccess(
              `Imported ${response.source_format} (${response.signal_count} signals, ${response.state_count} states, ${response.property_count} properties)`,
            );
          }

          setState({
            content: response.ctxdsl,
            fileName: fileName.replace(`.${ext}`, ".ctxdsl"),
            isDirty: false,
            lastValidated: undefined,
            validationResult: undefined,
            importSource: {
              originalFileName: fileName,
              originalContent: content,
              sourceFormat: response.source_format,
              warnings: response.warnings,
              signalCount: response.signal_count,
              stateCount: response.state_count,
              propertyCount: response.property_count,
              stateValuations: response.state_valuations,
              transitionObservations: response.transition_observations,
            },
          });
          editorRef.current?.setValue(response.ctxdsl);
          return;
        } catch (err) {
          handleError(err, "adapter import");
          // Fall through to load raw content on error
        }
      }

      // Direct CTXDSL load (existing behavior)
      setState({
        content,
        fileName,
        isDirty: false,
        lastValidated: undefined,
        validationResult: undefined,
        importSource: undefined,
      });
      editorRef.current?.setValue(content);
    },
    [toast, handleError],
  );

  const saveFile = useCallback(() => {
    const content = editorRef.current?.getValue() || state.content;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setState((prev) => ({
      ...prev,
      isDirty: false,
    }));
    toast.showSuccess("File saved successfully");
  }, [state.fileName, state.content, toast]);

  const validate = useCallback(async () => {
    const content = editorRef.current?.getValue() || state.content;
    if (!content.trim()) {
      toast.showError("Cannot validate empty content");
      return;
    }

    setIsValidating(true);
    try {
      const response = await summarizeContext({
        context: {
          name: state.fileName,
          content,
        },
        sidecars: [],
        format: "json",
      });

      setState((prev) => ({
        ...prev,
        lastValidated: new Date(),
        validationResult: {
          success: true,
          summary: response.summary,
        },
      }));
      toast.showSuccess("Validation successful");
    } catch (error) {
      const errorMessage = handleError(error);
      setState((prev) => ({
        ...prev,
        lastValidated: new Date(),
        validationResult: {
          success: false,
          error: errorMessage,
        },
      }));
    } finally {
      setIsValidating(false);
    }
  }, [state.content, state.fileName, toast, handleError]);

  const undo = useCallback(() => {
    editorRef.current?.trigger("undo", "undo", {});
  }, []);

  const redo = useCallback(() => {
    editorRef.current?.trigger("redo", "redo", {});
  }, []);

  const clearImportSource = useCallback(() => {
    setState((prev) => ({ ...prev, importSource: undefined }));
  }, []);

  return {
    state,
    editorRef,
    setContent,
    setFileName,
    newFile,
    loadFile,
    saveFile,
    validate,
    isValidating,
    undo,
    redo,
    clearImportSource,
  };
};
