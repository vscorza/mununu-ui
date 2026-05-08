import Editor, { BeforeMount, OnMount } from "@monaco-editor/react";
import { useCtxdslEditor } from "../../hooks/useCtxdslEditor";
import { EditorToolbar, SvFrontend } from "./EditorToolbar";
import { registerCtxdslLanguage } from "../../monaco/ctxdsl-language";
import { registerCtxdslTheme } from "../../monaco/ctxdsl-theme";
import { useAppStore } from "../../store/appStore";
import { Tabs } from "../common/Tabs";
import "./CtxdslEditor.css";

export const CtxdslEditor = () => {
  const { theme } = useAppStore();
  const {
    state,
    editorRef,
    setContent,
    newFile,
    loadFile,
    saveFile,
    validate,
    isValidating,
    undo,
    redo,
  } = useCtxdslEditor();

  // Register Monaco language and theme before editor mounts
  const handleEditorWillMount: BeforeMount = (monacoInstance) => {
    registerCtxdslLanguage(monacoInstance);
    registerCtxdslTheme(monacoInstance);
  };

  const handleEditorDidMount: OnMount = (editor, _monacoInstance) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || "");
  };

  const handleLoadFile = async (file: File, svFrontend?: SvFrontend) => {
    const text = await file.text();
    loadFile(text, file.name, svFrontend);
  };

  const tabs = [
    {
      id: "editor",
      label: "Editor",
      content: (
        <div className="flex flex-col h-full min-h-0">
          <EditorToolbar
            fileName={state.fileName}
            isDirty={state.isDirty}
            isValidating={isValidating}
            onNew={newFile}
            onSave={saveFile}
            onValidate={validate}
            onUndo={undo}
            onRedo={redo}
            onLoadFile={handleLoadFile}
          />
          <div
            className="flex-1 min-h-0 border border-gray-200 dark:border-gray-700"
            style={{ minHeight: "400px" }}
          >
            <Editor
              height="100%"
              language="ctxdsl"
              theme={theme === "dark" ? "ctxdsl-dark" : "ctxdsl-light"}
              value={state.content}
              onChange={handleEditorChange}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 dark:text-gray-400">
                    Loading editor...
                  </div>
                </div>
              }
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      id: "validation",
      label: "Validation",
      content: (
        <div className="validation-container">
          {state.validationResult ? (
            <div>
              {state.validationResult.success ? (
                <div>
                  <div className="validation-success">
                    <h3>✓ Validation Successful</h3>
                    {state.lastValidated && (
                      <p>
                        Last validated: {state.lastValidated.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {state.validationResult.summary && (
                    <div className="validation-summary">
                      <div>
                        <h4>
                          Context: {state.validationResult.summary.context_name}
                        </h4>
                        <div className="validation-summary-grid">
                          <div>
                            <span>Automata:</span>{" "}
                            <strong>
                              {state.validationResult.summary.automata.length}
                            </strong>
                          </div>
                          <div>
                            <span>Formulas:</span>{" "}
                            <strong>
                              {state.validationResult.summary.formulas_count}
                            </strong>
                          </div>
                          <div>
                            <span>Controllers:</span>{" "}
                            <strong>
                              {state.validationResult.summary.controllers_count}
                            </strong>
                          </div>
                        </div>
                      </div>
                      {state.validationResult.summary.automata.length > 0 && (
                        <div>
                          <h5>Automata Details:</h5>
                          <div>
                            {state.validationResult.summary.automata.map(
                              (automaton, idx) => (
                                <div key={idx} className="automaton-card">
                                  <div>{automaton.name}</div>
                                  <div>
                                    {automaton.states_count} states,{" "}
                                    {automaton.transitions_count} transitions
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="validation-error">
                  <h3>✗ Validation Failed</h3>
                  {state.validationResult.error && (
                    <p>{state.validationResult.error}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="validation-empty">
              <p>No validation results yet.</p>
              <p>
                Click "Validate" in the editor toolbar to validate your context.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="ctxdsl-editor-container">
      <div className="ctxdsl-editor-header">
        <h1>CTXDSL Editor</h1>
        <p>
          Create and edit CTXDSL context specifications with syntax highlighting
          and validation.
        </p>
      </div>
      <div className="ctxdsl-editor-content">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
};
