import { useState } from 'react'
import { useGraphVisualization } from '../../hooks/useGraphVisualization'
import { MultiGraphView } from './MultiGraphView'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Tabs } from '../common/Tabs'
import { useToast } from '../../hooks/useToast'
import './GraphsView.css'

export const GraphsView = () => {
  const {
    state,
    fetchGraphs,
    clearGraphs,
    setSelectedGraphType,
    setSelectedAutomaton,
    setSearchText,
    setSelectedNodeId,
    getAvailableAutomata,
    getFilteredGraphs,
  } = useGraphVisualization()

  const [contextInput, setContextInput] = useState('')
  const [contextName, setContextName] = useState('')
  const [graphTypes, setGraphTypes] = useState<('dsl' | 'unrolled')[]>(['dsl', 'unrolled'])
  const toast = useToast()

  const handleGenerateGraphs = () => {
    if (!contextInput.trim()) {
      toast.showError('Please enter context content')
      return
    }
    fetchGraphs(contextInput, contextName || undefined, graphTypes)
  }

  const handleLoadFromFile = async (file: File) => {
    const text = await file.text()
    setContextInput(text)
    setContextName(file.name)
  }

  const handleExportPNG = () => {
    // TODO: Implement PNG export
    toast.showInfo('PNG export coming soon')
  }

  const handleExportSVG = () => {
    // TODO: Implement SVG export
    toast.showInfo('SVG export coming soon')
  }

  const availableAutomata = getAvailableAutomata()
  const filteredGraphs = getFilteredGraphs()

  const tabs = [
    {
      id: 'input',
      label: 'Input',
      content: (
        <div className="graphs-input-tab">
          <div className="graphs-input-section">
            <div className="graphs-input-header">
              <h3>Context Input</h3>
              <p>Enter or load a CTXDSL context to generate graph visualizations</p>
            </div>
            <div className="graphs-input-controls">
              <Input
                label="Context Name (optional)"
                value={contextName}
                onChange={e => setContextName(e.target.value)}
                placeholder="my-context.ctxdsl"
              />
              <div className="graphs-input-textarea-wrapper">
                <label className="graphs-input-label">Context Content</label>
                <textarea
                  className="graphs-input-textarea"
                  value={contextInput}
                  onChange={e => setContextInput(e.target.value)}
                  placeholder="Paste your CTXDSL context here..."
                  rows={15}
                />
              </div>
              <div className="graphs-input-options">
                <div className="graphs-input-option-group">
                  <label className="graphs-input-option-label">Graph Types:</label>
                  <div className="graphs-input-checkboxes">
                    <label className="graphs-input-checkbox">
                      <input
                        type="checkbox"
                        checked={graphTypes.includes('dsl')}
                        onChange={e => {
                          if (e.target.checked) {
                            setGraphTypes([...graphTypes, 'dsl'])
                          } else {
                            setGraphTypes(graphTypes.filter(t => t !== 'dsl'))
                          }
                        }}
                      />
                      DSL
                    </label>
                    <label className="graphs-input-checkbox">
                      <input
                        type="checkbox"
                        checked={graphTypes.includes('unrolled')}
                        onChange={e => {
                          if (e.target.checked) {
                            setGraphTypes([...graphTypes, 'unrolled'])
                          } else {
                            setGraphTypes(graphTypes.filter(t => t !== 'unrolled'))
                          }
                        }}
                      />
                      Unrolled
                    </label>
                  </div>
                </div>
              </div>
              <div className="graphs-input-actions">
                <label className="graphs-input-file-label">
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
                    className="graphs-input-file-input"
                  />
                  <span className="button button-ghost button-sm">📂 Load from File</span>
                </label>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerateGraphs}
                  isLoading={state.isLoading}
                  disabled={!contextInput.trim() || graphTypes.length === 0}
                >
                  Generate Graphs
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'graphs',
      label: 'Graphs',
      content: (
        <div className="graphs-display-tab">
          {state.isLoading ? (
            <div className="graphs-loading">
              <LoadingSpinner />
              <p>Generating graphs...</p>
            </div>
          ) : state.error ? (
            <div className="graphs-error">
              <h3>Error</h3>
              <p>{state.error}</p>
              <Button variant="secondary" onClick={clearGraphs}>
                Clear
              </Button>
            </div>
          ) : filteredGraphs.length > 0 ? (
            <div className="graphs-content">
              <div className="graphs-header">
                <div className="graphs-header-info">
                  <h2 className="graphs-title">Graph Visualizations</h2>
                  {state.lastFetched && (
                    <p className="graphs-timestamp">
                      Generated: {state.lastFetched.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="graphs-header-actions">
                  <Button variant="ghost" size="sm" onClick={handleExportPNG}>
                    📥 Export PNG
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleExportSVG}>
                    📥 Export SVG
                  </Button>
                </div>
              </div>

              <div className="graphs-filters">
                {availableAutomata.length > 1 && (
                  <div className="graphs-filter">
                    <label className="graphs-filter-label">Automaton:</label>
                    <select
                      className="graphs-filter-select"
                      value={state.selectedAutomaton || ''}
                      onChange={e => setSelectedAutomaton(e.target.value || null)}
                    >
                      <option value="">All Automata</option>
                      {availableAutomata.map(automaton => (
                        <option key={automaton} value={automaton}>
                          {automaton}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="graphs-filter">
                  <label className="graphs-filter-label">Graph Type:</label>
                  <select
                    className="graphs-filter-select"
                    value={state.selectedGraphType}
                    onChange={e => setSelectedGraphType(e.target.value as 'dsl' | 'unrolled')}
                  >
                    <option value="">All Types</option>
                    <option value="dsl">DSL</option>
                    <option value="unrolled">Unrolled</option>
                  </select>
                </div>
                <div className="graphs-filter">
                  <Input
                    label="Search nodes"
                    value={state.searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Search by label..."
                  />
                </div>
              </div>

              <div className="graphs-view-container">
                <MultiGraphView
                  graphs={filteredGraphs}
                  searchText={state.searchText}
                  selectedNodeId={state.selectedNodeId}
                  onNodeSelect={setSelectedNodeId}
                />
              </div>
            </div>
          ) : (
            <div className="graphs-empty-state">
              <p>No graphs available.</p>
              <p className="graphs-empty-hint">
                Go to the "Input" tab to generate graphs from a CTXDSL context.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="graphs-view-container">
      <div className="graphs-view-header">
        <h1>Graph Visualization</h1>
        <p>Visualize automata graphs from CTXDSL context specifications.</p>
      </div>
      <div className="graphs-view-content">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}
