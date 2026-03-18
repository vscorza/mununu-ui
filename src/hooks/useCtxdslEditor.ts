import { useState, useCallback, useRef } from "react";
import * as monaco from "monaco-editor";
import { summarizeContext } from "../api/endpoints";
import { useToast } from "./useToast";
import { useErrorHandler } from "./useErrorHandler";

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
    });
    editorRef.current?.setValue("");
  }, []);

  const loadFile = useCallback((content: string, fileName: string) => {
    setState({
      content,
      fileName,
      isDirty: false,
      lastValidated: undefined,
      validationResult: undefined,
    });
    editorRef.current?.setValue(content);
  }, []);

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
  };
};
