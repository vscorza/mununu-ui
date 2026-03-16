import { useState } from 'react'
import './ProofObligations.css'

interface ProofObligation {
  state: string
  detail?: string | null
}

interface ProofObligationsProps {
  proofObligations?: ProofObligation[]
}

export const ProofObligations = ({ proofObligations }: ProofObligationsProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!proofObligations || proofObligations.length === 0) {
    return (
      <div className="proof-obligations-empty">
        <p>No proof obligations available</p>
      </div>
    )
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="proof-obligations">
      <div className="proof-obligations-header">
        <h3 className="proof-obligations-title">Proof Obligations</h3>
        <span className="proof-obligations-count">{proofObligations.length} obligation(s)</span>
      </div>
      <div className="proof-obligations-list">
        {proofObligations.map((obligation, index) => (
          <div key={index} className="proof-obligation-item">
            <div className="proof-obligation-header" onClick={() => toggleExpand(index)}>
              <div className="proof-obligation-state">
                <span className="proof-obligation-state-label">State:</span>
                <span className="proof-obligation-state-value">{obligation.state}</span>
              </div>
              <div className="proof-obligation-expand">{expandedIndex === index ? '▼' : '▶'}</div>
            </div>
            {expandedIndex === index && obligation.detail && (
              <div className="proof-obligation-detail">
                <div className="proof-obligation-detail-label">Details:</div>
                <div className="proof-obligation-detail-content">{obligation.detail}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="proof-obligations-info">
        <p className="proof-obligations-description">
          Proof obligations represent states where additional verification is required to ensure the
          specification is satisfied. Each obligation indicates a state that needs to be proven
          safe.
        </p>
      </div>
    </div>
  )
}
