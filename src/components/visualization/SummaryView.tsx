import { useState } from 'react'
import { useSummary } from '../../hooks/useSummary'
import { AutomatonCard } from './AutomatonCard'
import { SummaryTable } from './SummaryTable'
import { SummaryJSON } from './SummaryJSON'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Tabs } from '../common/Tabs'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { useToast } from '../../hooks/useToast'
import './SummaryView.css'

export const SummaryView = () => {
  const {
    state,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    filterText,
    setFilterText,
    fetchSummary,
    clearSummary,
    exportJSON,
    exportCSV,
    getFilteredAndSortedAutomata,
  } = useSummary()

  const [contextInput, setContextInput] = useState('')
  const [contextName, setContextName] = useState('')
  const toast = useToast()

  const handleGenerateSummary = () => {
    if (!contextInput.trim()) {
      toast.showError('Please enter context content')
      return
    }
    fetchSummary(contextInput, contextName || undefined)
  }

  const handleLoadFromFile = async (file: File) => {
    const text = await file.text()
    setContextInput(text)
    setContextName(file.name)
  }

  const filteredAutomata = getFilteredAndSortedAutomata()
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCards(newExpanded)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const tabs = [
    {
      id: 'input',
      label: 'Input',
      content: (
        <div className="summary-input-tab">
          <div className="summary-input-section">
            <div className="summary-input-header">
              <h3>Context Input</h3>
              <p>Enter or load a CTXDSL context to generate a summary</p>
            </div>
            <div className="summary-input-controls">
              <Input
                label="Context Name (optional)"
                value={contextName}
                onChange={e => setContextName(e.target.value)}
                placeholder="my-context.ctxdsl"
              />
              <div className="summary-input-textarea-wrapper">
                <label className="summary-input-label">Context Content</label>
                <textarea
                  className="summary-input-textarea"
                  value={contextInput}
                  onChange={e => setContextInput(e.target.value)}
                  placeholder="Paste your CTXDSL context here..."
                  rows={15}
                />
              </div>
              <div className="summary-input-actions">
                <label className="summary-input-file-label">
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
                    className="summary-input-file-input"
                  />
                  <span className="button button-ghost button-sm">📂 Load from File</span>
                </label>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerateSummary}
                  isLoading={state.isLoading}
                  disabled={!contextInput.trim()}
                >
                  Generate Summary
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'summary',
      label: 'Summary',
      content: (
        <div className="summary-display-tab">
          {state.isLoading ? (
            <div className="summary-loading">
              <LoadingSpinner />
              <p>Generating summary...</p>
            </div>
          ) : state.error ? (
            <div className="summary-error">
              <h3>Error</h3>
              <p>{state.error}</p>
              <Button variant="secondary" onClick={clearSummary}>
                Clear
              </Button>
            </div>
          ) : state.summary ? (
            <div className="summary-content">
              <div className="summary-header">
                <div className="summary-header-info">
                  <h2 className="summary-title">{state.summary.context_name}</h2>
                  {state.lastFetched && (
                    <p className="summary-timestamp">
                      Generated: {state.lastFetched.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="summary-header-actions">
                  <Button variant="ghost" size="sm" onClick={exportJSON}>
                    📥 Export JSON
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportCSV}>
                    📥 Export CSV
                  </Button>
                </div>
              </div>

              <div className="summary-stats">
                <div className="summary-stat-card">
                  <div className="summary-stat-label">Automata</div>
                  <div className="summary-stat-value">{state.summary.automata.length}</div>
                </div>
                <div className="summary-stat-card">
                  <div className="summary-stat-label">Formulas</div>
                  <div className="summary-stat-value">{state.summary.formulas_count}</div>
                </div>
                <div className="summary-stat-card">
                  <div className="summary-stat-label">Controllers</div>
                  <div className="summary-stat-value">{state.summary.controllers_count}</div>
                </div>
              </div>

              <div className="summary-view-controls">
                <div className="summary-view-mode-toggle">
                  <Button
                    variant={viewMode === 'cards' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    🎴 Cards
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    📊 Table
                  </Button>
                  <Button
                    variant={viewMode === 'json' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('json')}
                  >
                    {`{}`} JSON
                  </Button>
                </div>
                {(viewMode === 'cards' || viewMode === 'table') && (
                  <div className="summary-filter">
                    <Input
                      label="Filter automata"
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                      placeholder="Search by name..."
                    />
                  </div>
                )}
              </div>

              {viewMode === 'cards' && (
                <div className="summary-cards-view">
                  {filteredAutomata.length === 0 ? (
                    <div className="summary-empty">
                      <p>No automata found matching your filter.</p>
                    </div>
                  ) : (
                    filteredAutomata.map((automaton, index) => (
                      <AutomatonCard
                        key={index}
                        name={automaton.name}
                        statesCount={automaton.states_count}
                        transitionsCount={automaton.transitions_count}
                        isExpanded={expandedCards.has(index)}
                        onToggleExpand={() => toggleCard(index)}
                      />
                    ))
                  )}
                </div>
              )}

              {viewMode === 'table' && (
                <SummaryTable
                  automata={filteredAutomata}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
              )}

              {viewMode === 'json' && <SummaryJSON summary={state.summary} />}
            </div>
          ) : (
            <div className="summary-empty-state">
              <p>No summary available.</p>
              <p className="summary-empty-hint">
                Go to the "Input" tab to generate a summary from a CTXDSL context.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="summary-view-container">
      <div className="summary-view-header">
        <h1>Summary Visualization</h1>
        <p>Generate and visualize summaries from CTXDSL context specifications.</p>
      </div>
      <div className="summary-view-content">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}
