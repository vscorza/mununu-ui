import type { SortField, SortOrder } from '../../hooks/useSummary'
import './SummaryTable.css'

interface Automaton {
  name: string
  states_count: number
  transitions_count: number
}

interface SummaryTableProps {
  automata: Automaton[]
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}

export const SummaryTable = ({ automata, sortField, sortOrder, onSort }: SummaryTableProps) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="summary-table-container">
      <table className="summary-table">
        <thead>
          <tr>
            <th className="summary-table-header" onClick={() => onSort('name')}>
              <div className="summary-table-header-content">
                Name
                <span className="summary-table-sort-icon">{getSortIcon('name')}</span>
              </div>
            </th>
            <th className="summary-table-header" onClick={() => onSort('states')}>
              <div className="summary-table-header-content">
                States
                <span className="summary-table-sort-icon">{getSortIcon('states')}</span>
              </div>
            </th>
            <th className="summary-table-header" onClick={() => onSort('transitions')}>
              <div className="summary-table-header-content">
                Transitions
                <span className="summary-table-sort-icon">{getSortIcon('transitions')}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {automata.length === 0 ? (
            <tr>
              <td colSpan={3} className="summary-table-empty">
                No automata found
              </td>
            </tr>
          ) : (
            automata.map((automaton, index) => (
              <tr key={index} className="summary-table-row">
                <td className="summary-table-cell summary-table-cell-name">{automaton.name}</td>
                <td className="summary-table-cell">{automaton.states_count}</td>
                <td className="summary-table-cell">{automaton.transitions_count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
