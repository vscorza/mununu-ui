import { useState } from 'react'
import { useSynthesis } from '../../hooks/useSynthesis'
import { DiagnosticsView } from '../visualization/DiagnosticsView'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Tabs } from '../common/Tabs'
import { useToast } from '../../hooks/useToast'
import './SynthesisWorkflow.css'

export const SynthesisWorkflow = () => {
  const { state, synthesize, setSelectedTraceIndex, setSelectedTraceStep, clearResult } =
    useSynthesis()

  const [contextInput, setContextInput] = useState('')
  const [contextName, setContextName] = useState('')
  const [automaton, setAutomaton] = useState('')
  const [formula, setFormula] = useState('')
  const [minimize, setMinimize] = useState(false)
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(true)
  const toast = useToast()

  const handleSynthesize = () => {
    if (!contextInput.trim()) {
      toast.showError('Please enter context content')
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

    synthesize(contextInput, automaton, formula, contextName || undefined, {
      minimize,
      diagnostics: diagnosticsEnabled,
    })
  }

  const handleLoadFromFile = async (file: File) => {
    const text = await file.text()
    setContextInput(text)
    setContextName(file.name)
  }

  const handleDownloadController = () => {
    if (!state.result?.controller) {
      toast.showError('No controller to download')
      return
    }

    const controllerContent = state.result.controller.content || ''
    const blob = new Blob([controllerContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contextName || 'controller'}.ctxdsl`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.showSuccess('Controller downloaded')
  }

  const tabs = [
    {
      id: 'input',
      label: 'Input',
      content: (
        <div className="synthesis-input-tab">
          <div className="synthesis-input-section">
            <div className="synthesis-input-header">
              <h3>Synthesis Input</h3>
              <p>Enter context, automaton, and formula to synthesize a controller</p>
            </div>
            <div className="synthesis-input-controls">
              <Input
                label="Context Name (optional)"
                value={contextName}
                onChange={e => setContextName(e.target.value)}
                placeholder="my-context.ctxdsl"
              />
              <div className="synthesis-input-textarea-wrapper">
                <label className="synthesis-input-label">Context Content</label>
                <textarea
                  className="synthesis-input-textarea"
                  value={contextInput}
                  onChange={e => setContextInput(e.target.value)}
                  placeholder="Paste your CTXDSL context here..."
                  rows={10}
                />
              </div>
              <Input
                label="Automaton Name"
                value={automaton}
                onChange={e => setAutomaton(e.target.value)}
                placeholder="automaton_name"
                required
              />
              <div className="synthesis-input-textarea-wrapper">
                <label className="synthesis-input-label">Formula</label>
                <textarea
                  className="synthesis-input-textarea"
                  value={formula}
                  onChange={e => setFormula(e.target.value)}
                  placeholder="Enter LTL formula..."
                  rows={5}
                />
              </div>
              <div className="synthesis-input-options">
                <label className="synthesis-input-checkbox">
                  <input
                    type="checkbox"
                    checked={minimize}
                    onChange={e => setMinimize(e.target.checked)}
                  />
                  Minimize controller
                </label>
                <label className="synthesis-input-checkbox">
                  <input
                    type="checkbox"
                    checked={diagnosticsEnabled}
                    onChange={e => setDiagnosticsEnabled(e.target.checked)}
                  />
                  Enable diagnostics
                </label>
              </div>
              <div className="synthesis-input-actions">
                <label className="synthesis-input-file-label">
                  <input
                    type="file"
                    accept=".ctxdsl,.txt"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleLoadFromFile(file)
                      }
                      e.target.value = ''
                    }}
                    className="synthesis-input-file-input"
                  />
                  <span className="button button-ghost button-sm">📂 Load Context from File</span>
                </label>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSynthesize}
                  isLoading={state.isLoading}
                  disabled={!contextInput.trim() || !automaton.trim() || !formula.trim()}
                >
                  Synthesize Controller
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'results',
      label: 'Results',
      content: (
        <div className="synthesis-results-tab">
          {state.isLoading ? (
            <div className="synthesis-loading">
              <LoadingSpinner />
              <p>Synthesizing controller...</p>
            </div>
          ) : state.error ? (
            <div className="synthesis-error">
              <h3>Error</h3>
              <p>{state.error}</p>
              <Button variant="secondary" onClick={clearResult}>
                Clear
              </Button>
            </div>
          ) : state.result ? (
            <div className="synthesis-results-content">
              <div className="synthesis-results-header">
                <div className="synthesis-results-status">
                  <h2 className="synthesis-results-title">
                    {state.result.realizable ? (
                      <span className="synthesis-results-success">✓ Realizable</span>
                    ) : (
                      <span className="synthesis-results-failure">✗ Unrealizable</span>
                    )}
                  </h2>
                  {state.lastSynthesized && (
                    <p className="synthesis-results-timestamp">
                      Synthesized: {state.lastSynthesized.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="synthesis-results-actions">
                  {state.result.realizable && state.result.controller && (
                    <Button variant="primary" size="sm" onClick={handleDownloadController}>
                      📥 Download Controller
                    </Button>
                  )}
                </div>
              </div>

              {state.result.realizable && state.result.controller && (
                <div className="synthesis-controller-section">
                  <h3 className="synthesis-controller-title">Synthesized Controller</h3>
                  <div className="synthesis-controller-content">
                    <pre className="synthesis-controller-code">
                      {state.result.controller.content || ''}
                    </pre>
                  </div>
                </div>
              )}

              {!state.result.realizable && state.result.diagnostics && (
                <div className="synthesis-diagnostics-section">
                  <h3 className="synthesis-diagnostics-title">Diagnostics</h3>
                  <DiagnosticsView
                    diagnostics={state.result.diagnostics}
                    selectedCounterstrategyIndex={state.selectedTraceIndex}
                    selectedCounterstrategyStep={state.selectedTraceStep}
                    selectedDeadlockIndex={state.selectedTraceIndex}
                    selectedDeadlockStep={state.selectedTraceStep}
                    selectedCounterexampleStep={state.selectedTraceStep}
                    onCounterstrategyTraceSelect={setSelectedTraceIndex}
                    onCounterstrategyStepSelect={setSelectedTraceStep}
                    onDeadlockTraceSelect={setSelectedTraceIndex}
                    onDeadlockStepSelect={setSelectedTraceStep}
                    onCounterexampleStepSelect={setSelectedTraceStep}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="synthesis-empty-state">
              <p>No synthesis results available.</p>
              <p className="synthesis-empty-hint">
                Go to the "Input" tab to synthesize a controller from a context, automaton, and
                formula.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="synthesis-workflow-container">
      <div className="synthesis-workflow-header">
        <h1>Controller Synthesis</h1>
        <p>Synthesize controllers from CTXDSL contexts, automata, and LTL formulas.</p>
      </div>
      <div className="synthesis-workflow-content">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}
