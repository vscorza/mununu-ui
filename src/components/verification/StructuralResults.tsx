import { useState } from 'react'
import type { components } from '../../api/types'
import { Button } from '../common/Button'
import './VerificationResults.css'

type StructuralVerificationResult = components['schemas']['StructuralVerificationResult']

interface CheckMetadataApi {
  check_name: string
  description: string
  severity: string
}

interface StructuralResultsProps {
  result: StructuralVerificationResult
}

export const StructuralResults = ({ result }: StructuralResultsProps) => {
  const [showMetadata, setShowMetadata] = useState(false)

  // Create a map of check metadata for quick lookup
  // available_checks may not exist yet in API types, so we use type assertion
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
        <h4 className="verification-results-title">Structural Verification</h4>
        <div
          className={`verification-status ${
            result.all_passed ? 'verification-status-passed' : 'verification-status-failed'
          }`}
        >
          {result.all_passed ? (
            <span>✓ All checks passed</span>
          ) : (
            <span>
              ✗ {result.error_count} errors, {result.warning_count} warnings, {result.info_count}{' '}
              info
            </span>
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
                  (c: StructuralVerificationResult['checks'][0]) => c.check_name === meta.check_name
                )
                const status = checkResult ? (checkResult.passed ? '✓' : '✗') : '○'
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
        {result.checks.map((check: StructuralVerificationResult['checks'][0], idx: number) => {
          const metadata = metadataMap.get(check.check_name)
          return (
            <div
              key={idx}
              className={`verification-check ${
                check.passed ? 'verification-check-passed' : 'verification-check-failed'
              } verification-check-${check.severity.toLowerCase()}`}
            >
              <div className="verification-check-header">
                <span className="verification-check-name">{check.check_name}</span>
                <span
                  className={`verification-severity verification-severity-${check.severity.toLowerCase()}`}
                >
                  {check.severity}
                </span>
              </div>
              {metadata && (
                <div className="verification-check-description">{metadata.description}</div>
              )}
              <div className="verification-check-evidence">{check.evidence}</div>
              {check.location && check.location.length > 0 && (
                <div className="verification-check-location">
                  <strong>Location:</strong> {check.location.join(' → ')}
                </div>
              )}
              {check.suggestions && check.suggestions.length > 0 && (
                <div className="verification-check-suggestions">
                  <strong>Suggestions ({check.suggestions.length}):</strong>
                  <ul className="verification-suggestions-list">
                    {check.suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="verification-suggestion-item">
                        <span className="verification-suggestion-icon">💡</span>
                        <span className="verification-suggestion-text">{suggestion}</span>
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
