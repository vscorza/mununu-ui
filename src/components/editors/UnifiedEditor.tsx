import { useState, useCallback, useRef, useEffect } from 'react'
import Editor, { BeforeMount, OnMount } from '@monaco-editor/react'
import { useCtxdslEditor } from '../../hooks/useCtxdslEditor'
import { useSummary } from '../../hooks/useSummary'
import { useGraphVisualization } from '../../hooks/useGraphVisualization'
import { useVerification } from '../../hooks/useVerification'
import { useSynthesis } from '../../hooks/useSynthesis'
import { EditorToolbar } from './EditorToolbar'
import { registerCtxdslLanguage } from '../../monaco/ctxdsl-language'
import { registerCtxdslTheme } from '../../monaco/ctxdsl-theme'
import { useAppStore } from '../../store/appStore'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { SummaryTable } from '../visualization/SummaryTable'
import { AutomatonCard } from '../visualization/AutomatonCard'
import { SummaryJSON } from '../visualization/SummaryJSON'
import { MultiGraphView } from '../visualization/MultiGraphView'
import { DiagnosticsView } from '../visualization/DiagnosticsView'
import type { SortField } from '../../hooks/useSummary'
import './UnifiedEditor.css'

type RightTab = 'summary' | 'graphs' | 'verification' | 'synthesis'

export const UnifiedEditor = () => {
  const { theme } = useAppStore()

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
  } = useCtxdslEditor()

  // Feature hooks
  const summary = useSummary()
  const graphs = useGraphVisualization()
  const verification = useVerification()
  const synthesis = useSynthesis()

  // Panel state
  const [activeTab, setActiveTab] = useState<RightTab>('summary')
  const [dividerPosition, setDividerPosition] = useState(55) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Diagnostics trace state
  const [counterStratIdx, setCounterStratIdx] = useState(0)
  const [counterStratStep, setCounterStratStep] = useState(0)
  const [deadlockIdx, setDeadlockIdx] = useState(0)
  const [deadlockStep, setDeadlockStep] = useState(0)
  const [counterexStep, setCounterexStep] = useState(0)

  // Synthesis inputs
  const [synthAutomaton, setSynthAutomaton] = useState('')
  const [synthFormula, setSynthFormula] = useState('')
  const [synthMinimize, setSynthMinimize] = useState(false)
  const [synthDiagnostics, setSynthDiagnostics] = useState(true)

  // Graph options
  const [graphTypes, setGraphTypes] = useState<('dsl' | 'unrolled')[]>(['dsl', 'unrolled'])

  // Verification options
  const [verifyFormula, setVerifyFormula] = useState('')
  const [verifyAutomaton, setVerifyAutomaton] = useState('')

  // Monaco setup
  const handleEditorWillMount: BeforeMount = monacoInstance => {
    registerCtxdslLanguage(monacoInstance)
    registerCtxdslTheme(monacoInstance)
  }

  const handleEditorDidMount: OnMount = (editor, _monacoInstance) => {
    editorRef.current = editor
  }

  const handleEditorChange = (value: string | undefined) => {
    setContent(value || '')
  }

  const handleLoadFile = async (file: File) => {
    const text = await file.text()
    loadFile(text, file.name)
  }

  // Get current editor content
  const getContent = useCallback(() => {
    return editorRef.current?.getValue() || editorState.content
  }, [editorRef, editorState.content])

  // Action handlers
  const handleSummary = () => {
    const content = getContent()
    if (!content.trim()) return
    summary.fetchSummary(content, editorState.fileName)
  }

  const handleGraphs = () => {
    const content = getContent()
    if (!content.trim()) return
    graphs.fetchGraphs(content, editorState.fileName, graphTypes)
  }

  const handleVerify = () => {
    const content = getContent()
    if (!content.trim()) return
    verification.verify(
      content,
      editorState.fileName,
      verifyFormula || undefined,
      verifyAutomaton || undefined
    )
  }

  const handleSynthesize = () => {
    const content = getContent()
    if (!content.trim()) return
    synthesis.synthesize(content, synthAutomaton, synthFormula, editorState.fileName, {
      minimize: synthMinimize,
      diagnostics: synthDiagnostics,
    })
  }

  const handleDownloadController = () => {
    if (!synthesis.state.result?.controller) return
    const controllerContent = synthesis.state.result.controller.content || ''
    const blob = new Blob([controllerContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${synthAutomaton || 'controller'}.ctxdsl`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Divider drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const percentage = ((e.clientX - rect.left) / rect.width) * 100
      setDividerPosition(Math.min(Math.max(percentage, 20), 80))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'graphs', label: 'Graphs' },
    { id: 'verification', label: 'Verification' },
    { id: 'synthesis', label: 'Synthesis' },
  ]

  const filteredAutomata = summary.getFilteredAndSortedAutomata()

  return (
    <div
      ref={containerRef}
      className={`unified-editor ${isDragging ? 'unified-editor--dragging' : ''}`}
    >
      {/* Left pane: Editor */}
      <div className="unified-editor__left" style={{ width: `${dividerPosition}%` }}>
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
              theme={theme === 'dark' ? 'ctxdsl-dark' : 'ctxdsl-light'}
              value={editorState.content}
              onChange={handleEditorChange}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
                </div>
              }
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
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
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`unified-editor__tab ${activeTab === tab.id ? 'unified-editor__tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="unified-editor__panel">
          {activeTab === 'summary' && (
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
                    'Generate Summary'
                  )}
                </Button>
                {summary.state.summary && (
                  <>
                    <Button variant="ghost" size="sm" onClick={summary.clearSummary}>
                      Clear
                    </Button>
                    <Button variant="ghost" size="sm" onClick={summary.exportJSON}>
                      Export JSON
                    </Button>
                    <Button variant="ghost" size="sm" onClick={summary.exportCSV}>
                      Export CSV
                    </Button>
                  </>
                )}
              </div>
              {summary.state.error && (
                <div className="unified-editor__error">{summary.state.error}</div>
              )}
              {summary.state.summary && (
                <div className="unified-editor__results">
                  <div className="unified-editor__summary-header">
                    <strong>{summary.state.summary.context_name}</strong>
                    <span>
                      {summary.state.summary.automata.length} automata,{' '}
                      {summary.state.summary.formulas_count} formulas,{' '}
                      {summary.state.summary.controllers_count} controllers
                    </span>
                  </div>
                  {summary.viewMode === 'table' && (
                    <SummaryTable
                      automata={filteredAutomata}
                      sortField={summary.sortField}
                      sortOrder={summary.sortOrder}
                      onSort={(field: SortField) => {
                        if (summary.sortField === field) {
                          summary.setSortOrder(summary.sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          summary.setSortField(field)
                          summary.setSortOrder('asc')
                        }
                      }}
                    />
                  )}
                  {summary.viewMode === 'cards' &&
                    filteredAutomata.map((a, i) => (
                      <AutomatonCard
                        key={i}
                        name={a.name}
                        statesCount={a.states_count}
                        transitionsCount={a.transitions_count}
                      />
                    ))}
                  {summary.viewMode === 'json' && summary.state.summary && (
                    <SummaryJSON summary={summary.state.summary} />
                  )}
                  <div className="unified-editor__view-modes">
                    {(['table', 'cards', 'json'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => summary.setViewMode(mode)}
                        className={`unified-editor__view-mode ${summary.viewMode === mode ? 'unified-editor__view-mode--active' : ''}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'graphs' && (
            <div className="unified-editor__section">
              <div className="unified-editor__action-bar">
                <label className="unified-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={graphTypes.includes('dsl')}
                    onChange={e => {
                      setGraphTypes(prev =>
                        e.target.checked ? [...prev, 'dsl'] : prev.filter(t => t !== 'dsl')
                      )
                    }}
                  />
                  DSL
                </label>
                <label className="unified-editor__checkbox">
                  <input
                    type="checkbox"
                    checked={graphTypes.includes('unrolled')}
                    onChange={e => {
                      setGraphTypes(prev =>
                        e.target.checked
                          ? [...prev, 'unrolled']
                          : prev.filter(t => t !== 'unrolled')
                      )
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
                    'Generate Graphs'
                  )}
                </Button>
                {graphs.state.graphs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={graphs.clearGraphs}>
                    Clear
                  </Button>
                )}
              </div>
              {graphs.state.error && (
                <div className="unified-editor__error">{graphs.state.error}</div>
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

          {activeTab === 'verification' && (
            <div className="unified-editor__section">
              <div className="unified-editor__action-bar">
                <Input
                  label=""
                  value={verifyFormula}
                  onChange={e => setVerifyFormula(e.target.value)}
                  placeholder="Formula (optional, all if empty)"
                />
                <Input
                  label=""
                  value={verifyAutomaton}
                  onChange={e => setVerifyAutomaton(e.target.value)}
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
                    'Verify'
                  )}
                </Button>
                {verification.state.result && (
                  <Button variant="ghost" size="sm" onClick={verification.clearResult}>
                    Clear
                  </Button>
                )}
              </div>
              {verification.state.error && (
                <div className="unified-editor__error">{verification.state.error}</div>
              )}
              {verification.state.result && (
                <div className="unified-editor__results">
                  <div
                    className={`unified-editor__verify-badge ${verification.state.result.all_satisfied ? 'unified-editor__verify-badge--pass' : 'unified-editor__verify-badge--fail'}`}
                  >
                    {verification.state.result.all_satisfied
                      ? 'All Formulas Satisfied'
                      : 'Some Formulas Not Satisfied'}
                  </div>
                  <table className="unified-editor__verify-table">
                    <thead>
                      <tr>
                        <th>Formula</th>
                        <th>Automaton</th>
                        <th>Status</th>
                        <th>Satisfying</th>
                        <th>Initial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verification.state.result.results.map((r, i) => (
                        <tr key={i} className={r.satisfied ? '' : 'unified-editor__verify-row--fail'}>
                          <td>{r.formula_name}</td>
                          <td>{r.automaton}</td>
                          <td>{r.satisfied ? 'Satisfied' : 'Not Satisfied'}</td>
                          <td>
                            {r.satisfying_states}/{r.total_states}
                          </td>
                          <td>
                            {r.initial_satisfying.length}/{r.initial_states.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {verification.state.result.results
                    .filter(r => r.initial_violating.length > 0)
                    .map((r, i) => (
                      <div key={i} className="unified-editor__verify-detail">
                        <strong>
                          {r.formula_name} on {r.automaton}
                        </strong>
                        <div>
                          Violating initial states: {r.initial_violating.join(', ')}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'synthesis' && (
            <div className="unified-editor__section">
              <div className="unified-editor__synth-inputs">
                <Input
                  label="Automaton"
                  value={synthAutomaton}
                  onChange={e => setSynthAutomaton(e.target.value)}
                  placeholder="Automaton name"
                />
                <Input
                  label="Formula"
                  value={synthFormula}
                  onChange={e => setSynthFormula(e.target.value)}
                  placeholder="Formula name"
                />
                <div className="unified-editor__synth-options">
                  <label className="unified-editor__checkbox">
                    <input
                      type="checkbox"
                      checked={synthMinimize}
                      onChange={e => setSynthMinimize(e.target.checked)}
                    />
                    Minimize
                  </label>
                  <label className="unified-editor__checkbox">
                    <input
                      type="checkbox"
                      checked={synthDiagnostics}
                      onChange={e => setSynthDiagnostics(e.target.checked)}
                    />
                    Diagnostics
                  </label>
                </div>
              </div>
              <div className="unified-editor__action-bar">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSynthesize}
                  disabled={synthesis.state.isLoading}
                >
                  {synthesis.state.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" /> Synthesizing...
                    </>
                  ) : (
                    'Synthesize'
                  )}
                </Button>
                {synthesis.state.result && (
                  <Button variant="ghost" size="sm" onClick={synthesis.clearResult}>
                    Clear
                  </Button>
                )}
              </div>
              {synthesis.state.error && (
                <div className="unified-editor__error">{synthesis.state.error}</div>
              )}
              {synthesis.state.result && (
                <div className="unified-editor__results">
                  <div
                    className={`unified-editor__verify-badge ${synthesis.state.result.realizable ? 'unified-editor__verify-badge--pass' : 'unified-editor__verify-badge--fail'}`}
                  >
                    {synthesis.state.result.realizable ? 'Realizable' : 'Unrealizable'}
                  </div>
                  {synthesis.state.result.controller && (
                    <div className="unified-editor__controller">
                      <div className="unified-editor__action-bar">
                        <Button variant="ghost" size="sm" onClick={handleDownloadController}>
                          Download Controller
                        </Button>
                      </div>
                      <pre className="unified-editor__code">
                        {synthesis.state.result.controller.content}
                      </pre>
                    </div>
                  )}
                  {synthesis.state.result.diagnostics && (
                    <DiagnosticsView
                      diagnostics={synthesis.state.result.diagnostics}
                      selectedCounterstrategyIndex={counterStratIdx}
                      selectedCounterstrategyStep={counterStratStep}
                      selectedDeadlockIndex={deadlockIdx}
                      selectedDeadlockStep={deadlockStep}
                      selectedCounterexampleStep={counterexStep}
                      onCounterstrategyTraceSelect={setCounterStratIdx}
                      onCounterstrategyStepSelect={setCounterStratStep}
                      onDeadlockTraceSelect={setDeadlockIdx}
                      onDeadlockStepSelect={setDeadlockStep}
                      onCounterexampleStepSelect={setCounterexStep}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
