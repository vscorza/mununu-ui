import type { BusinessVerificationResult } from '../../api/endpoints'
import type { components } from '../../api/types'
import { Button } from '../common/Button'
import './VerificationResults.css'

type Violation = NonNullable<BusinessVerificationResult['violations']>[number]
type PropertySuggestion = NonNullable<BusinessVerificationResult['property_suggestions']>[number]
type ProcessSummaryApi = components['schemas']['ProcessSummaryApi']

interface BusinessResultsProps {
  result: BusinessVerificationResult
  /** Optional context information for display */
  contextConfig?: {
    domain?: string
    locale?: string | null
  } | null
  /** Optional process summary for context */
  currentSummary?: ProcessSummaryApi | null
  /** Optional iteration number */
  iterationNumber?: number | null
  /** Optional IR extraction result for linking violations to IR elements */
  irExtractionResult?: components['schemas']['IrExtractionResultApi'] | null
  /** Callback when "Apply Fix" is clicked for a violation */
  onApplyFix?: (violation: Violation) => void
  /** Callback when "Verify Property" is clicked for a suggestion */
  onVerifyProperty?: (suggestion: PropertySuggestion) => void
}

export const BusinessResults = ({
  result,
  contextConfig,
  currentSummary,
  iterationNumber,
  irExtractionResult,
  onApplyFix,
  onVerifyProperty,
}: BusinessResultsProps) => {
  const violations = result.violations || []
  const suggestions = result.property_suggestions || []
  const domain = result.domain
  const notes = result.notes || []

  // Helper to find IR element by name from location
  const findIrElement = (location: string[]) => {
    if (!irExtractionResult || !location || location.length === 0) return null

    const locationStr = location.join(' → ')
    const lastLocation = location[location.length - 1]
    // Try to find matching state or transition
    const state = irExtractionResult.ir_model.states.find(
      s => s.name === lastLocation || locationStr.includes(s.name)
    )
    if (state) return { type: 'state' as const, element: state, name: state.name }

    const transition = irExtractionResult.ir_model.transitions.find(
      t => t.label === lastLocation || locationStr.includes(t.label || '')
    )
    if (transition)
      return { type: 'transition' as const, element: transition, name: transition.label }

    return null
  }

  // Helper to find actor/decision context from summary
  const findActorContext = (location: string[]) => {
    if (!currentSummary || !location || location.length === 0) return null

    const locationStr = location.join(' → ').toLowerCase()
    // Try to find matching actor
    const actor = currentSummary.actors.find(
      a => locationStr.includes(a.name.toLowerCase()) || locationStr.includes(a.role.toLowerCase())
    )
    if (actor) return { type: 'actor', name: actor.name, role: actor.role }

    // Try to find matching decision point
    const decision = currentSummary.decision_points.find(d =>
      locationStr.includes(d.description.toLowerCase())
    )
    if (decision) return { type: 'decision', description: decision.description }

    return null
  }

  return (
    <div className="verification-results-section">
      <div className="verification-results-header">
        <h4 className="verification-results-title">Business Verification</h4>
        <div className="verification-context-info">
          {domain && (
            <div className="verification-domain">
              <strong>Domain:</strong> {domain}
            </div>
          )}
          {contextConfig?.locale && (
            <div className="verification-locale">
              <strong>Locale:</strong> {contextConfig.locale}
            </div>
          )}
          {iterationNumber && iterationNumber > 1 && (
            <div className="verification-iteration">
              <strong>Iteration:</strong> {iterationNumber}
            </div>
          )}
        </div>
        {result.compliant !== undefined && (
          <div
            className={`verification-status ${
              result.compliant === true
                ? 'verification-status-passed'
                : result.compliant === false
                  ? 'verification-status-failed'
                  : 'verification-status-warning'
            }`}
          >
            {result.compliant === true ? (
              <span>✓ Compliant</span>
            ) : result.compliant === false ? (
              <span>✗ Non-Compliant</span>
            ) : (
              <span>⚠ Partial Compliance</span>
            )}
          </div>
        )}
      </div>

      {/* Context Summary */}
      {(currentSummary || contextConfig) && (
        <div className="verification-context-summary">
          <h5>Verification Context</h5>
          {currentSummary && (
            <div className="verification-context-item">
              <strong>Process Summary:</strong> {currentSummary.summary.substring(0, 200)}
              {currentSummary.summary.length > 200 ? '...' : ''}
            </div>
          )}
          {contextConfig && (
            <div className="verification-context-item">
              <strong>Use Context:</strong> Domain: {contextConfig.domain || 'N/A'}
              {contextConfig.locale && `, Locale: ${contextConfig.locale}`}
            </div>
          )}
        </div>
      )}

      {violations.length > 0 && (
        <div className="verification-business-violations">
          <h5>Business Rule Violations ({violations.length})</h5>
          <div className="verification-checks">
            {violations.map((violation: Violation, idx: number) => {
              const irElement = violation.location ? findIrElement(violation.location) : null
              const actorContext = violation.location ? findActorContext(violation.location) : null

              return (
                <div
                  key={idx}
                  className={`verification-check verification-check-${violation.severity.toLowerCase()}`}
                >
                  <div className="verification-check-header">
                    <span className="verification-check-name">{violation.rule_name}</span>
                    <span
                      className={`verification-severity verification-severity-${violation.severity.toLowerCase()}`}
                    >
                      {violation.severity}
                    </span>
                  </div>
                  {violation.description && (
                    <div className="verification-check-description">{violation.description}</div>
                  )}

                  {/* Actor/Decision Context */}
                  {actorContext && (
                    <div className="verification-check-context">
                      {actorContext.type === 'actor' && (
                        <div className="verification-context-badge">
                          <strong>Actor:</strong> {actorContext.name} ({actorContext.role})
                        </div>
                      )}
                      {actorContext.type === 'decision' && (
                        <div className="verification-context-badge">
                          <strong>Decision Point:</strong> {actorContext.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* IR Element Link */}
                  {irElement && (
                    <div className="verification-check-ir-link">
                      <strong>IR Element:</strong>{' '}
                      <span className="verification-ir-element-type">{irElement.type}</span> -{' '}
                      {irElement.name}
                    </div>
                  )}

                  {violation.location && violation.location.length > 0 && (
                    <div className="verification-check-location">
                      <strong>Location:</strong> {violation.location.join(' → ')}
                    </div>
                  )}

                  {/* Suggested Fix with Apply Button */}
                  {violation.suggested_fix && (
                    <div className="verification-check-suggested-fix">
                      <div className="verification-fix-content">
                        <strong>Suggested Fix:</strong> {violation.suggested_fix}
                      </div>
                      {onApplyFix && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onApplyFix(violation)}
                          className="verification-apply-fix-btn"
                        >
                          Apply Fix
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="verification-business-suggestions">
          <h5>Property Suggestions ({suggestions.length})</h5>
          <div className="verification-checks">
            {suggestions.map((suggestion: PropertySuggestion, idx: number) => {
              // Find IR elements referenced by related_elements
              type RelatedIrElement = {
                type: 'state' | 'transition'
                element: unknown
                name: string
              }
              const relatedIrElements: RelatedIrElement[] =
                irExtractionResult && suggestion.related_elements
                  ? suggestion.related_elements
                      .map((elementName): RelatedIrElement | null => {
                        const state = irExtractionResult.ir_model.states.find(
                          s => s.name === elementName
                        )
                        if (state)
                          return { type: 'state' as const, element: state, name: state.name }
                        const transition = irExtractionResult.ir_model.transitions.find(
                          t => t.label === elementName
                        )
                        if (transition)
                          return {
                            type: 'transition' as const,
                            element: transition,
                            name: transition.label,
                          }
                        return null
                      })
                      .filter((el): el is RelatedIrElement => el !== null)
                  : []

              return (
                <div key={idx} className="verification-check verification-check-suggestion">
                  <div className="verification-check-header">
                    <span className="verification-check-name">
                      {suggestion.name || `Property ${idx + 1}`}
                    </span>
                    <span className="verification-severity verification-severity-info">
                      {suggestion.category || 'Suggestion'}
                    </span>
                    {suggestion.confidence !== undefined && (
                      <span className="verification-confidence-badge">
                        {(suggestion.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                  <div className="verification-check-evidence">{suggestion.description}</div>
                  {suggestion.rationale && (
                    <div className="verification-check-description">
                      <strong>Rationale:</strong> {suggestion.rationale}
                    </div>
                  )}
                  {suggestion.formula && (
                    <div className="verification-check-formula">
                      <strong>Formula:</strong> <code>{suggestion.formula}</code>
                    </div>
                  )}

                  {/* IR Elements Reference */}
                  {relatedIrElements.length > 0 && (
                    <div className="verification-check-ir-elements">
                      <strong>Related IR Elements:</strong>
                      <div className="verification-ir-elements-list">
                        {relatedIrElements.map((irEl, elIdx) => (
                          <span key={elIdx} className="verification-ir-element-badge">
                            <span className="verification-ir-element-type">{irEl.type}</span>:{' '}
                            {irEl.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback to related_elements if IR not available */}
                  {relatedIrElements.length === 0 &&
                    suggestion.related_elements &&
                    suggestion.related_elements.length > 0 && (
                      <div className="verification-check-related">
                        <strong>Related Elements:</strong> {suggestion.related_elements.join(', ')}
                      </div>
                    )}

                  {/* Verify Property Button */}
                  {onVerifyProperty && (
                    <div className="verification-property-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onVerifyProperty(suggestion)}
                        className="verification-verify-property-btn"
                      >
                        Verify Property
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="verification-business-notes">
          <h5>Notes</h5>
          <ul>
            {notes.map((note: string, idx: number) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {violations.length === 0 && suggestions.length === 0 && (
        <div className="verification-empty-state">
          <p>No business verification results available.</p>
        </div>
      )}
    </div>
  )
}
