import { useState, useCallback, useRef, useEffect } from "react";
import Editor, { BeforeMount, OnMount } from "@monaco-editor/react";
import { useCtxdslEditor } from "../../hooks/useCtxdslEditor";
import { useSummary } from "../../hooks/useSummary";
import { useGraphVisualization } from "../../hooks/useGraphVisualization";
import { useVerification } from "../../hooks/useVerification";
import { EditorToolbar } from "./EditorToolbar";
import { registerCtxdslLanguage } from "../../monaco/ctxdsl-language";
import { registerCtxdslTheme } from "../../monaco/ctxdsl-theme";
import { useAppStore } from "../../store/appStore";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { SummaryTable } from "../visualization/SummaryTable";
import { AutomatonCard } from "../visualization/AutomatonCard";
import { SummaryJSON } from "../visualization/SummaryJSON";
import { MultiGraphView } from "../visualization/MultiGraphView";
import { CounterstrategyView } from "../visualization/CounterstrategyView";
import type { SortField } from "../../hooks/useSummary";
import "./UnifiedEditor.css";

type RightTab = "summary" | "graphs" | "verification";

export const UnifiedEditor = () => {
  const { theme } = useAppStore();

  // Editor state
  const {
    state: editorState,
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

  // Feature hooks
  const summary = useSummary();
  const graphs = useGraphVisualization();
  const verification = useVerification();

  // Panel state
  const [activeTab, setActiveTab] = useState<RightTab>("summary");
  const [dividerPosition, setDividerPosition] = useState(55); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Graph options
  const [graphTypes, setGraphTypes] = useState<("dsl" | "unrolled")[]>([
    "dsl",
    "unrolled",
  ]);

  // Verification options
  const [verifyFormula, setVerifyFormula] = useState("");
  const [verifyAutomaton, setVerifyAutomaton] = useState("");

  // Monaco setup
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

  const handleLoadFile = async (file: File) => {
    const text = await file.text();
    loadFile(text, file.name);
  };

  // Get current editor content
  const getContent = useCallback(() => {
    return editorRef.current?.getValue() || editorState.content;
  }, [editorRef, editorState.content]);

  // Action handlers
  const handleSummary = () => {
    const content = getContent();
    if (!content.trim()) return;
    summary.fetchSummary(content, editorState.fileName);
  };

  const handleGraphs = () => {
    const content = getContent();
    if (!content.trim()) return;
    graphs.fetchGraphs(content, editorState.fileName, graphTypes);
  };

  const handleVerify = () => {
    const content = getContent();
    if (!content.trim()) return;
    verification.verify(
      content,
      editorState.fileName,
      verifyFormula || undefined,
      verifyAutomaton || undefined,
    );
  };

  // Divider drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerPosition(Math.min(Math.max(percentage, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const tabs: { id: RightTab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "graphs", label: "Graphs" },
    { id: "verification", label: "Verification" },
  ];

  const filteredAutomata = summary.getFilteredAndSortedAutomata();

  return (
    <div
      ref={containerRef}
      className={`unified-editor ${isDragging ? "unified-editor--dragging" : ""}`}
    >
      {/* Left pane: Editor */}
      <div
        className="unified-editor__left"
        style={{ width: `${dividerPosition}%` }}
      >
        <div className="unified-editor__editor-wrap">
          <EditorToolbar
            fileName={editorState.fileName}
            isDirty={editorState.isDirty}
            isValidating={isValidating}
            onNew={newFile}
            onSave={saveFile}
            onValidate={validate}
            onUndo={undo}
            onRedo={redo}
            onLoadFile={handleLoadFile}
          />
          <div className="unified-editor__monaco">
            <Editor
              height="100%"
              language="ctxdsl"
              theme={theme === "dark" ? "ctxdsl-dark" : "ctxdsl-light"}
              value={editorState.content}
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
      </div>

      {/* Divider */}
      <div className="unified-editor__divider" onMouseDown={handleMouseDown}>
        <div className="unified-editor__divider-handle" />
      </div>

      {/* Right pane: Results */}
      <div
        className="unified-editor__right"
        style={{ width: `${100 - dividerPosition}%` }}
      >
        {/* Tab bar */}
        <div className="unified-editor__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`unified-editor__tab ${activeTab === tab.id ? "unified-editor__tab--active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="unified-editor__panel">
          {activeTab === "summary" && (
            <div className="unified-editor__section">
              <div className="unified-editor__action-bar">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSummary}
                  disabled={summary.state.isLoading}
                >
                  {summary.state.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" /> Summarizing...
                    </>
                  ) : (
                    "Generate Summary"
                  )}
                </Button>
                {summary.state.summary && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={summary.clearSummary}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={summary.exportJSON}
                    >
                      Export JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={summary.exportCSV}
                    >
                      Export CSV
                    </Button>
                  </>
                )}
              </div>
              {summary.state.error && (
                <div className="unified-editor__error">
                  {summary.state.error}
                </div>
              )}
              {summary.state.summary && (
                <div className="unified-editor__results">
                  <div className="unified-editor__summary-header">
                    <strong>{summary.state.summary.context_name}</strong>
                    <span>
                      {summary.state.summary.automata.length} automata,{" "}
                      {summary.state.summary.formulas_count} formulas,{" "}
                      {summary.state.summary.controllers_count} controllers
                    </span>
                  </div>
                  {summary.viewMode === "table" && (
                    <SummaryTable
                      automata={filteredAutomata}
                      sortField={summary.sortField}
                      sortOrder={summary.sortOrder}
                      onSort={(field: SortField) => {
                        if (summary.sortField === field) {
                          summary.setSortOrder(
                            summary.sortOrder === "asc" ? "desc" : "asc",
                          );
                        } else {
                          summary.setSortField(field);
                          summary.setSortOrder("asc");
                        }
                      }}
                    />
                  )}
                  {summary.viewMode === "cards" &&
                    filteredAutomata.map((a, i) => (
                      <AutomatonCard
                        key={i}
                        name={a.name}
                        statesCount={a.states_count}
                        transitionsCount={a.transitions_count}
                      />
                    ))}
                  {summary.viewMode === "json" && summary.state.summary && (
                    <SummaryJSON summary={summary.state.summary} />
                  )}
                  <div className="unified-editor__view-modes">
                    {(["table", "cards", "json"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => summary.setViewMode(mode)}
                        className={`unified-editor__view-mode ${summary.viewMode === mode ? "unified-editor__view-mode--active" : ""}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {summary.state.summary.controllers &&
                    summary.state.summary.controllers.length > 0 && (
                      <div className="unified-editor__controllers-summary">
                        <strong>Controllers</strong>
                        <table className="unified-editor__verify-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Source</th>
                              <th>Formula</th>
                              <th>Realizable</th>
                              <th>States</th>
                              <th>Transitions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.state.summary.controllers.map((c, i) => (
                              <tr key={i}>
                                <td>{c.name}</td>
                                <td>{c.source}</td>
                                <td>{c.formula}</td>
                                <td>
                                  <span
                                    className={
                                      c.realizable
                                        ? "unified-editor__verify-badge--pass"
                                        : "unified-editor__verify-badge--fail"
                                    }
                                    style={{
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {c.realizable ? "Yes" : "No"}
                                  </span>
                                </td>
                                <td>{c.states_count}</td>
                                <td>{c.transitions_count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {activeTab === "graphs" && (
            <div className="unified-editor__section">
              <div className="unified-editor__action-bar">
                <label className="unified-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={graphTypes.includes("dsl")}
                    onChange={(e) => {
                      setGraphTypes((prev) =>
                        e.target.checked
                          ? [...prev, "dsl"]
                          : prev.filter((t) => t !== "dsl"),
                      );
                    }}
                  />
                  DSL
                </label>
                <label className="unified-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={graphTypes.includes("unrolled")}
                    onChange={(e) => {
                      setGraphTypes((prev) =>
                        e.target.checked
                          ? [...prev, "unrolled"]
                          : prev.filter((t) => t !== "unrolled"),
                      );
                    }}
                  />
                  Unrolled
                </label>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGraphs}
                  disabled={graphs.state.isLoading}
                >
                  {graphs.state.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" /> Generating...
                    </>
                  ) : (
                    "Generate Graphs"
                  )}
                </Button>
                {graphs.state.graphs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={graphs.clearGraphs}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {graphs.state.error && (
                <div className="unified-editor__error">
                  {graphs.state.error}
                </div>
              )}
              {graphs.state.graphs.length > 0 && (
                <div className="unified-editor__results unified-editor__graphs">
                  <MultiGraphView
                    graphs={graphs.getFilteredGraphs()}
                    searchText={graphs.state.searchText}
                    selectedNodeId={graphs.state.selectedNodeId}
                    onNodeSelect={graphs.setSelectedNodeId}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "verification" && (
            <div className="unified-editor__section">
              <div className="unified-editor__action-bar">
                <Input
                  label=""
                  value={verifyFormula}
                  onChange={(e) => setVerifyFormula(e.target.value)}
                  placeholder="Formula (optional, all if empty)"
                />
                <Input
                  label=""
                  value={verifyAutomaton}
                  onChange={(e) => setVerifyAutomaton(e.target.value)}
                  placeholder="Automaton (optional)"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleVerify}
                  disabled={verification.state.isLoading}
                >
                  {verification.state.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" /> Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
                {verification.state.result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={verification.clearResult}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {verification.state.error && (
                <div className="unified-editor__error">
                  {verification.state.error}
                </div>
              )}
              {verification.state.result && (
                <div className="unified-editor__results">
                  <div
                    className={`unified-editor__verify-badge ${verification.state.result.all_satisfied ? "unified-editor__verify-badge--pass" : "unified-editor__verify-badge--fail"}`}
                  >
                    {verification.state.result.all_satisfied
                      ? "All Formulas Satisfied"
                      : "Some Formulas Not Satisfied"}
                  </div>
                  <table className="unified-editor__verify-table">
                    <thead>
                      <tr>
                        <th>Formula</th>
                        <th>Automaton</th>
                        <th>Status</th>
                        <th>Satisfying</th>
                        <th>Initial</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {verification.state.result.results.map((r, i) => (
                        <tr
                          key={i}
                          className={
                            r.satisfied
                              ? ""
                              : "unified-editor__verify-row--fail"
                          }
                        >
                          <td>{r.formula_name}</td>
                          <td>{r.automaton}</td>
                          <td>{r.satisfied ? "Satisfied" : "Not Satisfied"}</td>
                          <td>
                            {r.satisfying_states}/{r.total_states}
                          </td>
                          <td>
                            {r.initial_satisfying.length}/
                            {r.initial_states.length}
                          </td>
                          <td>
                            {!r.satisfied && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={verification.isFetchingCounterstrategy(r.formula_name, r.automaton)}
                                onClick={() =>
                                  verification.fetchCounterstrategy(
                                    editorState.content,
                                    r.formula_name,
                                    r.automaton,
                                  )
                                }
                              >
                                {verification.isFetchingCounterstrategy(r.formula_name, r.automaton)
                                  ? "Computing..."
                                  : verification.getCounterstrategy(r.formula_name, r.automaton)
                                    ? "Refresh"
                                    : "Counterstrategy"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {verification.state.result.results
                    .filter((r) => !r.satisfied && verification.getCounterstrategy(r.formula_name, r.automaton)?.counterstrategy)
                    .map((r, i) => {
                      const csResult = verification.getCounterstrategy(r.formula_name, r.automaton)!;
                      return (
                        <div key={`cs-${i}`} className="unified-editor__verify-detail">
                          <CounterstrategyView
                            result={csResult.counterstrategy!}
                            formulaName={r.formula_name}
                            automatonName={r.automaton}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
