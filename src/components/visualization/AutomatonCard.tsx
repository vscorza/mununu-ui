import './AutomatonCard.css'

interface AutomatonCardProps {
  name: string
  statesCount: number
  transitionsCount: number
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export const AutomatonCard = ({
  name,
  statesCount,
  transitionsCount,
  isExpanded = false,
  onToggleExpand,
}: AutomatonCardProps) => {
  return (
    <div className="automaton-card">
      <div className="automaton-card-header" onClick={onToggleExpand}>
        <div className="automaton-card-title">
          <h3 className="automaton-card-name">{name}</h3>
        </div>
        <div className="automaton-card-stats">
          <span className="automaton-card-stat">
            <span className="automaton-card-stat-label">States:</span>
            <span className="automaton-card-stat-value">{statesCount}</span>
          </span>
          <span className="automaton-card-stat">
            <span className="automaton-card-stat-label">Transitions:</span>
            <span className="automaton-card-stat-value">{transitionsCount}</span>
          </span>
        </div>
        {onToggleExpand && (
          <div className="automaton-card-expand-icon">{isExpanded ? '▼' : '▶'}</div>
        )}
      </div>
      {isExpanded && (
        <div className="automaton-card-details">
          <div className="automaton-card-detail-item">
            <strong>Automaton Name:</strong> {name}
          </div>
          <div className="automaton-card-detail-item">
            <strong>Number of States:</strong> {statesCount}
          </div>
          <div className="automaton-card-detail-item">
            <strong>Number of Transitions:</strong> {transitionsCount}
          </div>
        </div>
      )}
    </div>
  )
}
