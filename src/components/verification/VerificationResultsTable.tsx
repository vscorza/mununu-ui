import { useState, useMemo } from 'react'
import type { components } from '../../api/types'
import './VerificationResultsTable.css'

type StructuralCheckResultApi = components['schemas']['StructuralCheckResultApi']
type BehavioralCheckResultApi = components['schemas']['BehavioralCheckResultApi']
type StructuralVerificationResult = components['schemas']['StructuralVerificationResult']
type BehavioralVerificationResult = components['schemas']['BehavioralVerificationResult']

type CheckType = 'structural' | 'behavioral'

interface TableCheck {
  id: string
  type: CheckType
  checkName: string
  status: 'passed' | 'failed' | 'satisfied' | 'violated'
  severity?: 'Error' | 'Warning' | 'Info'
  evidence: string
  location?: string[]
  suggestions?: string[]
  fixSuggestions?: string[]
  formula?: string
  satisfyingStates?: string[]
  violatingStates?: string[]
  description?: string
}

interface VerificationResultsTableProps {
  structural?: StructuralVerificationResult
  behavioral?: BehavioralVerificationResult
  // Business verification is handled separately, not in this table
}

type SortField = 'checkName' | 'status' | 'severity' | 'type'
type SortOrder = 'asc' | 'desc'

export const VerificationResultsTable = ({
  structural,
  behavioral,
}: VerificationResultsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('checkName')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterSeverity, setFilterSeverity] = useState<Set<string>>(
    new Set(['Error', 'Warning', 'Info'])
  )
  const [filterStatus, setFilterStatus] = useState<Set<string>>(
    new Set(['passed', 'failed', 'satisfied', 'violated'])
  )
  const [filterType, setFilterType] = useState<Set<string>>(new Set(['structural', 'behavioral']))
  const [searchQuery, setSearchQuery] = useState('')

  // Create metadata maps for descriptions
  // available_checks may not exist yet in API types
  type CheckMetadata = { check_name: string; description: string; severity: string }
  const structuralMetadataMap = useMemo(() => {
    const map = new Map<string, { description: string; severity: string }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structuralAvailableChecks = (structural as any)?.available_checks as
      | CheckMetadata[]
      | undefined

    if (structuralAvailableChecks) {
      structuralAvailableChecks.forEach((meta: CheckMetadata) => {
        map.set(meta.check_name, {
          description: meta.description || '',
          severity: meta.severity || '',
        })
      })
    }
    return map
  }, [structural])

  const behavioralMetadataMap = useMemo(() => {
    const map = new Map<string, { description: string; severity: string }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const behavioralAvailableChecks = (behavioral as any)?.available_checks as
      | CheckMetadata[]
      | undefined

    if (behavioralAvailableChecks) {
      behavioralAvailableChecks.forEach((meta: CheckMetadata) => {
        map.set(meta.check_name, {
          description: meta.description || '',
          severity: meta.severity || '',
        })
      })
    }
    return map
  }, [behavioral])

  // Convert API results to table format
  const allChecks = useMemo<TableCheck[]>(() => {
    const checks: TableCheck[] = []

    if (structural) {
      structural.checks.forEach((check: StructuralCheckResultApi, idx: number) => {
        const metadata = structuralMetadataMap.get(check.check_name)
        checks.push({
          id: `structural-${idx}`,
          type: 'structural',
          checkName: check.check_name,
          status: check.passed ? 'passed' : 'failed',
          severity: check.severity as 'Error' | 'Warning' | 'Info' | undefined,
          evidence: check.evidence,
          location: check.location,
          suggestions: check.suggestions,
          description: metadata?.description,
        })
      })
    }

    if (behavioral) {
      behavioral.checks.forEach((check: BehavioralCheckResultApi, idx: number) => {
        const metadata = behavioralMetadataMap.get(check.check_name)
        checks.push({
          id: `behavioral-${idx}`,
          type: 'behavioral',
          checkName: check.check_name,
          status: check.satisfied ? 'satisfied' : 'violated',
          evidence: check.evidence,
          formula: check.formula,
          satisfyingStates: check.satisfying_states,
          violatingStates: check.violating_states,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fixSuggestions: (check as any).fix_suggestions as string[] | undefined,
          description: metadata?.description,
        })
      })
    }

    return checks
  }, [structural, behavioral, structuralMetadataMap, behavioralMetadataMap])

  // Filter and sort checks
  const filteredAndSortedChecks = useMemo(() => {
    const filtered = allChecks.filter(check => {
      // Severity filter (only for structural)
      if (check.type === 'structural' && check.severity) {
        if (!filterSeverity.has(check.severity)) return false
      }

      // Status filter
      if (!filterStatus.has(check.status)) return false

      // Type filter
      if (!filterType.has(check.type)) return false

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = check.checkName.toLowerCase().includes(query)
        const matchesEvidence = check.evidence.toLowerCase().includes(query)
        const matchesLocation = check.location?.some(loc => loc.toLowerCase().includes(query))
        const matchesFormula = check.formula?.toLowerCase().includes(query)
        if (!matchesName && !matchesEvidence && !matchesLocation && !matchesFormula) {
          return false
        }
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'checkName': {
          aValue = a.checkName.toLowerCase()
          bValue = b.checkName.toLowerCase()
          break
        }
        case 'status': {
          aValue = a.status
          bValue = b.status
          break
        }
        case 'severity': {
          const severityOrder = { Error: 0, Warning: 1, Info: 2 }
          aValue = severityOrder[a.severity || 'Info'] ?? 3
          bValue = severityOrder[b.severity || 'Info'] ?? 3
          break
        }
        case 'type': {
          aValue = a.type
          bValue = b.type
          break
        }
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allChecks, sortField, sortOrder, filterSeverity, filterStatus, filterType, searchQuery])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const toggleFilter = (set: Set<string>, value: string) => {
    const newSet = new Set(set)
    if (newSet.has(value)) {
      newSet.delete(value)
    } else {
      newSet.add(value)
    }
    return newSet
  }

  if (allChecks.length === 0) {
    return (
      <div className="verification-table-empty">
        <p>No verification checks available.</p>
      </div>
    )
  }

  return (
    <div className="verification-table-container">
      <div className="verification-table-filters">
        <div className="verification-table-search">
          <input
            type="text"
            placeholder="Search checks, evidence, location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="verification-table-search-input"
          />
        </div>

        <div className="verification-table-filter-group">
          <label className="verification-table-filter-label">Type:</label>
          <div className="verification-table-filter-buttons">
            <button
              className={`verification-table-filter-button ${
                filterType.has('structural') ? 'active' : ''
              }`}
              onClick={() => setFilterType(toggleFilter(filterType, 'structural'))}
            >
              Structural
            </button>
            <button
              className={`verification-table-filter-button ${
                filterType.has('behavioral') ? 'active' : ''
              }`}
              onClick={() => setFilterType(toggleFilter(filterType, 'behavioral'))}
            >
              Behavioral
            </button>
          </div>
        </div>

        <div className="verification-table-filter-group">
          <label className="verification-table-filter-label">Status:</label>
          <div className="verification-table-filter-buttons">
            <button
              className={`verification-table-filter-button ${
                filterStatus.has('passed') ? 'active' : ''
              }`}
              onClick={() => setFilterStatus(toggleFilter(filterStatus, 'passed'))}
            >
              Passed
            </button>
            <button
              className={`verification-table-filter-button ${
                filterStatus.has('failed') ? 'active' : ''
              }`}
              onClick={() => setFilterStatus(toggleFilter(filterStatus, 'failed'))}
            >
              Failed
            </button>
            <button
              className={`verification-table-filter-button ${
                filterStatus.has('satisfied') ? 'active' : ''
              }`}
              onClick={() => setFilterStatus(toggleFilter(filterStatus, 'satisfied'))}
            >
              Satisfied
            </button>
            <button
              className={`verification-table-filter-button ${
                filterStatus.has('violated') ? 'active' : ''
              }`}
              onClick={() => setFilterStatus(toggleFilter(filterStatus, 'violated'))}
            >
              Violated
            </button>
          </div>
        </div>

        <div className="verification-table-filter-group">
          <label className="verification-table-filter-label">Severity:</label>
          <div className="verification-table-filter-buttons">
            <button
              className={`verification-table-filter-button ${
                filterSeverity.has('Error') ? 'active' : ''
              }`}
              onClick={() => setFilterSeverity(toggleFilter(filterSeverity, 'Error'))}
            >
              Error
            </button>
            <button
              className={`verification-table-filter-button ${
                filterSeverity.has('Warning') ? 'active' : ''
              }`}
              onClick={() => setFilterSeverity(toggleFilter(filterSeverity, 'Warning'))}
            >
              Warning
            </button>
            <button
              className={`verification-table-filter-button ${
                filterSeverity.has('Info') ? 'active' : ''
              }`}
              onClick={() => setFilterSeverity(toggleFilter(filterSeverity, 'Info'))}
            >
              Info
            </button>
          </div>
        </div>

        <div className="verification-table-stats">
          Showing {filteredAndSortedChecks.length} of {allChecks.length} checks
        </div>
      </div>

      <div className="verification-table-wrapper">
        <table className="verification-table">
          <thead>
            <tr>
              <th className="verification-table-header" onClick={() => handleSort('type')}>
                <div className="verification-table-header-content">
                  Type
                  <span className="verification-table-sort-icon">{getSortIcon('type')}</span>
                </div>
              </th>
              <th className="verification-table-header" onClick={() => handleSort('checkName')}>
                <div className="verification-table-header-content">
                  Check Name
                  <span className="verification-table-sort-icon">{getSortIcon('checkName')}</span>
                </div>
              </th>
              <th className="verification-table-header" onClick={() => handleSort('status')}>
                <div className="verification-table-header-content">
                  Status
                  <span className="verification-table-sort-icon">{getSortIcon('status')}</span>
                </div>
              </th>
              <th className="verification-table-header" onClick={() => handleSort('severity')}>
                <div className="verification-table-header-content">
                  Severity
                  <span className="verification-table-sort-icon">{getSortIcon('severity')}</span>
                </div>
              </th>
              <th className="verification-table-header">Evidence</th>
              <th className="verification-table-header">Location</th>
              <th className="verification-table-header">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedChecks.length === 0 ? (
              <tr>
                <td colSpan={7} className="verification-table-empty-cell">
                  No checks match the current filters
                </td>
              </tr>
            ) : (
              filteredAndSortedChecks.map(check => (
                <tr
                  key={check.id}
                  className={`verification-table-row verification-table-row-${check.status} ${
                    check.severity ? `verification-table-row-${check.severity.toLowerCase()}` : ''
                  }`}
                >
                  <td className="verification-table-cell">
                    <span
                      className={`verification-table-type-badge verification-table-type-${check.type}`}
                    >
                      {check.type}
                    </span>
                  </td>
                  <td className="verification-table-cell verification-table-cell-name">
                    {check.checkName}
                  </td>
                  <td className="verification-table-cell">
                    <span
                      className={`verification-table-status-badge verification-table-status-${check.status}`}
                    >
                      {check.status === 'passed' && '✓ Passed'}
                      {check.status === 'failed' && '✗ Failed'}
                      {check.status === 'satisfied' && '✓ Satisfied'}
                      {check.status === 'violated' && '✗ Violated'}
                    </span>
                  </td>
                  <td className="verification-table-cell">
                    {check.severity ? (
                      <span
                        className={`verification-table-severity-badge verification-table-severity-${check.severity.toLowerCase()}`}
                      >
                        {check.severity}
                      </span>
                    ) : (
                      <span className="verification-table-severity-badge">—</span>
                    )}
                  </td>
                  <td className="verification-table-cell verification-table-cell-evidence">
                    {check.evidence}
                  </td>
                  <td className="verification-table-cell verification-table-cell-location">
                    {check.location && check.location.length > 0 ? (
                      <span className="verification-table-location">
                        {check.location.join(' → ')}
                      </span>
                    ) : (
                      <span className="verification-table-location-empty">—</span>
                    )}
                  </td>
                  <td className="verification-table-cell verification-table-cell-details">
                    <div className="verification-table-details">
                      {check.description && (
                        <div className="verification-table-detail-item">
                          <strong>Description:</strong> {check.description}
                        </div>
                      )}
                      {check.formula && (
                        <div className="verification-table-detail-item">
                          <strong>Formula:</strong> {check.formula}
                        </div>
                      )}
                      {check.suggestions && check.suggestions.length > 0 && (
                        <div className="verification-table-detail-item">
                          <strong>Suggestions ({check.suggestions.length}):</strong>
                          <ul className="verification-table-suggestions-list">
                            {check.suggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {check.fixSuggestions && check.fixSuggestions.length > 0 && (
                        <div className="verification-table-detail-item">
                          <strong>Fix Suggestions ({check.fixSuggestions.length}):</strong>
                          <ul className="verification-table-fix-suggestions-list">
                            {check.fixSuggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {check.satisfyingStates && check.satisfyingStates.length > 0 && (
                        <div className="verification-table-detail-item">
                          <strong>Satisfying states:</strong> {check.satisfyingStates.length}
                        </div>
                      )}
                      {check.violatingStates && check.violatingStates.length > 0 && (
                        <div className="verification-table-detail-item">
                          <strong>Violating states:</strong> {check.violatingStates.length}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
