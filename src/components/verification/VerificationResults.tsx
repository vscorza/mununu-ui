import { useState } from 'react'
import type { components } from '../../api/types'

type VerificationResponse = components['schemas']['VerificationResponse']
import { StructuralResults } from './StructuralResults'
import { BehavioralResults } from './BehavioralResults'
import { VerificationResultsTable } from './VerificationResultsTable'
import { Button } from '../common/Button'
import './VerificationResults.css'

interface VerificationResultsProps {
  verification: VerificationResponse
}

export const VerificationResults = ({ verification }: VerificationResultsProps) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  return (
    <div className="verification-results-container">
      <div className="verification-results-summary">
        <h3 className="verification-results-main-title">Verification Results</h3>
        <div
          className={`verification-overall-status ${verification.success ? 'success' : 'failed'}`}
        >
          {verification.success ? '✓ Verification completed' : '✗ Verification failed'}
        </div>
      </div>

      <div className="verification-results-view-toggle">
        <Button
          variant={viewMode === 'cards' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('cards')}
        >
          📋 Cards
        </Button>
        <Button
          variant={viewMode === 'table' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          📊 Table
        </Button>
      </div>

      {viewMode === 'table' ? (
        <VerificationResultsTable
          structural={verification.structural ?? undefined}
          behavioral={verification.behavioral ?? undefined}
        />
      ) : (
        <>
          {verification.structural && <StructuralResults result={verification.structural} />}

          {verification.behavioral && <BehavioralResults result={verification.behavioral} />}
        </>
      )}

      {verification.warnings && verification.warnings.length > 0 && (
        <div className="verification-warnings">
          <h4>Warnings</h4>
          <ul>
            {verification.warnings.map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {verification.errors && verification.errors.length > 0 && (
        <div className="verification-errors">
          <h4>Errors</h4>
          <ul>
            {verification.errors.map((error: string, idx: number) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
