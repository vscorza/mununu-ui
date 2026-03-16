import './GraphMetadata.css'

interface GraphMetadataProps {
  automaton: string
  graphType: 'dsl' | 'unrolled'
  statesCount: number
  transitionsCount: number
  initialStates?: string[]
}

export const GraphMetadata = ({
  automaton,
  graphType,
  statesCount,
  transitionsCount,
  initialStates,
}: GraphMetadataProps) => {
  return (
    <div className="graph-metadata">
      <div className="graph-metadata-header">
        <h3 className="graph-metadata-title">Graph Information</h3>
      </div>
      <div className="graph-metadata-content">
        <div className="graph-metadata-item">
          <span className="graph-metadata-label">Automaton:</span>
          <span className="graph-metadata-value">{automaton}</span>
        </div>
        <div className="graph-metadata-item">
          <span className="graph-metadata-label">Type:</span>
          <span className="graph-metadata-value graph-metadata-type">
            {graphType.toUpperCase()}
          </span>
        </div>
        <div className="graph-metadata-item">
          <span className="graph-metadata-label">States:</span>
          <span className="graph-metadata-value">{statesCount}</span>
        </div>
        <div className="graph-metadata-item">
          <span className="graph-metadata-label">Transitions:</span>
          <span className="graph-metadata-value">{transitionsCount}</span>
        </div>
        {initialStates && initialStates.length > 0 && (
          <div className="graph-metadata-item graph-metadata-initial-states">
            <span className="graph-metadata-label">Initial States:</span>
            <div className="graph-metadata-initial-states-list">
              {initialStates.map((state, idx) => (
                <span key={idx} className="graph-metadata-initial-state">
                  {state}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
