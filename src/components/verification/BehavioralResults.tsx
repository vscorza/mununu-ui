import { useState } from 'react'
import type { components } from '../../api/types'
import { Button } from '../common/Button'
import './VerificationResults.css'

type BehavioralVerificationResult = components['schemas']['BehavioralVerificationResult']

interface CheckMetadataApi {
  check_name: string
  description: string
  severity: string
}

interface BehavioralResultsProps {
  result: BehavioralVerificationResult
}

export const BehavioralResults = ({ result }: BehavioralResultsProps) => {
  const [showMetadata, setShowMetadata] = useState(false)

  // Create a map of check metadata for quick lookup
  // available_checks and fix_suggestions may not exist yet in API types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableChecks = (result as any).available_checks as CheckMetadataApi[] | undefined
  const metadataMap = new Map<string, CheckMetadataApi>()
  if (availableChecks) {
    availableChecks.forEach((meta: CheckMetadataApi) => {
      metadataMap.set(meta.check_name, meta)
    })
  }

  return (
    <div className="verification-results-section">
      <div className="verification-results-header">
        <h4 className="verification-results-title">Behavioral Verification</h4>
        <div
          className={`verification-status ${
            result.all_satisfied ? 'verification-status-satisfied' : 'verification-status-violated'
          }`}
        >
          {result.all_satisfied ? (
            <span>✓ All properties satisfied</span>
          ) : (
            <span>✗ {result.violation_count} violations</span>
          )}
        </div>
      </div>

      {/* Check Metadata Section */}
      {availableChecks && availableChecks.length > 0 && (
        <div className="verification-metadata-section">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMetadata(!showMetadata)}
            className="verification-metadata-toggle"
          >
            {showMetadata ? '▼' : '▶'} Available Checks ({availableChecks.length})
          </Button>
          {showMetadata && (
            <div className="verification-metadata-list">
              {availableChecks.map((meta: CheckMetadataApi, idx: number) => {
                const checkResult = result.checks.find(
                  (c: BehavioralVerificationResult['checks'][0]) => c.check_name === meta.check_name
                )
                const status = checkResult ? (checkResult.satisfied ? '✓' : '✗') : '○'
                return (
                  <div
                    key={idx}
                    className={`verification-metadata-item verification-metadata-${meta.severity.toLowerCase()}`}
                  >
                    <div className="verification-metadata-header">
                      <span className="verification-metadata-status">{status}</span>
                      <span className="verification-metadata-name">{meta.check_name}</span>
                      <span
                        className={`verification-severity verification-severity-${meta.severity.toLowerCase()}`}
                      >
                        {meta.severity}
                      </span>
                    </div>
                    <div className="verification-metadata-description">{meta.description}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="verification-checks">
        {result.checks.map((check: BehavioralVerificationResult['checks'][0], idx: number) => {
          const metadata = metadataMap.get(check.check_name)
          return (
            <div
              key={idx}
              className={`verification-check ${
                check.satisfied ? 'verification-check-satisfied' : 'verification-check-violated'
              }`}
            >
              <div className="verification-check-header">
                <span className="verification-check-name">{check.check_name}</span>
                <span className="verification-check-formula">{check.formula}</span>
              </div>
              {metadata && (
                <div className="verification-check-description">{metadata.description}</div>
              )}
              <div className="verification-check-evidence">{check.evidence}</div>
              {check.satisfying_states && check.satisfying_states.length > 0 && (
                <div className="verification-check-states">
                  <strong>Satisfying states:</strong> {check.satisfying_states.join(', ')}
                </div>
              )}
              {check.violating_states && check.violating_states.length > 0 && (
                <div className="verification-check-states verification-check-violating-states">
                  <strong>Violating states:</strong> {check.violating_states.join(', ')}
                </div>
              )}
              {check.counterexample && (
                <div className="verification-check-counterexample">
                  <strong>Counterexample:</strong>
                  <div className="verification-counterexample-trace">
                    {check.counterexample.trace.map((state: string, i: number) => (
                      <span key={i} className="verification-counterexample-state">
                        {state}
                      </span>
                    ))}
                  </div>
                  <div className="verification-counterexample-description">
                    {check.counterexample.description}
                  </div>
                </div>
              )}
              {/* Fix Suggestions */}
              {!check.satisfied &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (check as any).fix_suggestions &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (check as any).fix_suggestions.length > 0 && (
                  <div className="verification-check-fix-suggestions">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <strong>Fix Suggestions ({(check as any).fix_suggestions.length}):</strong>
                    <ul className="verification-fix-suggestions-list">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(check as any).fix_suggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="verification-fix-suggestion-item">
                          <span className="verification-fix-suggestion-icon">🔧</span>
                          <span className="verification-fix-suggestion-text">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
