/**
 * Utility functions for verification-related operations
 * Extracted from VerificationPhase component for reusability
 */

import type { VerificationResponse } from '../hooks/useVerification'
import type { BusinessVerificationResult } from '../api/endpoints'
import type { components } from '../api/types'

type ProcessSummaryApi = components['schemas']['ProcessSummaryApi']
type EventLogSuggestionsApi = components['schemas']['EventLogSuggestionsApi']

/**
 * Generate a new session name for the next iteration
 * If the name ends with a number (not a decimal), increments it. Otherwise, adds "-iteration-N" suffix
 *
 * @param currentName - Current session name
 * @param iterationNumber - Next iteration number
 * @returns New session name
 */
export const generateNextIterationSessionName = (
  currentName: string,
  iterationNumber: number
): string => {
  // Check if name ends with a whole number (not decimal) at the end
  // Match: base name, optional separator (space, dash, underscore), and integer at the end
  // Exclude decimal numbers like "v1.0" or "2024.12" by using negative lookbehind
  // Since JavaScript doesn't support lookbehind in all browsers, we'll check manually

  // Try to match a trailing number with optional separator
  // Pattern: (base)(separator)(number) where separator is optional whitespace/dash/underscore
  // and the number is NOT preceded by a dot
  const trailingNumberPattern = /(.+?)(\s*[-_]?\s*)(\d+)$/
  const numberMatch = currentName.match(trailingNumberPattern)

  if (numberMatch) {
    // Check if the character immediately before the matched number is a dot
    // This indicates it's part of a decimal number
    const fullMatch = numberMatch[0]
    const matchStartPos = currentName.length - fullMatch.length
    const charBeforeMatch = matchStartPos > 0 ? currentName[matchStartPos - 1] : ''

    // If there's a dot immediately before the match, it's part of a decimal - don't increment
    if (charBeforeMatch === '.') {
      // It's a decimal, add iteration suffix instead
      return `${currentName} - Iteration ${iterationNumber}`
    }

    // Also check if the base name ends with a dot (for cases like "v1.0" where base is "v1.")
    const baseName = numberMatch[1]
    if (baseName.endsWith('.')) {
      // Base name ends with dot, likely a decimal - add iteration suffix
      return `${currentName} - Iteration ${iterationNumber}`
    }

    // Extract separator and number
    const separator = numberMatch[2]
    const numberStr = numberMatch[3]
    const currentNumber = parseInt(numberStr, 10)
    const nextNumber = currentNumber + 1

    // Reconstruct with incremented number
    return `${baseName}${separator}${nextNumber}`
  } else {
    // No trailing number found, add iteration suffix
    return `${currentName} - Iteration ${iterationNumber}`
  }
}

/**
 * Extract all fix suggestions from verification results
 * Combines suggestions from structural, behavioral, and business verifications
 *
 * @param verificationResult - Structural and behavioral verification results
 * @param businessResult - Business verification results
 * @returns Array of fix suggestion strings
 */
export const extractAllFixSuggestions = (
  verificationResult: VerificationResponse | null,
  businessResult: BusinessVerificationResult | null
): string[] => {
  const suggestions: string[] = []

  // Extract from behavioral checks
  if (verificationResult?.behavioral?.checks) {
    verificationResult.behavioral.checks.forEach(check => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fixSuggestions = (check as any).fix_suggestions as string[] | undefined
      if (fixSuggestions) {
        suggestions.push(...fixSuggestions)
      }
    })
  }

  // Extract from structural checks
  if (verificationResult?.structural?.checks) {
    verificationResult.structural.checks.forEach(check => {
      if (check.suggestions) {
        suggestions.push(...check.suggestions)
      }
    })
  }

  // Extract from business violations
  if (businessResult?.violations) {
    businessResult.violations.forEach(violation => {
      if (violation.suggested_fix) {
        suggestions.push(violation.suggested_fix)
      }
    })
  }

  return suggestions
}

/**
 * Format fix suggestions for inclusion in iteration description
 *
 * @param suggestions - Array of fix suggestion strings
 * @param iterationNumber - Current iteration number
 * @param previousSummaryText - Text from previous iteration summary (optional)
 * @returns Formatted string with suggestions
 */
export const formatFixSuggestions = (
  suggestions: string[],
  iterationNumber: number,
  previousSummaryText?: string
): string => {
  if (suggestions.length === 0) {
    return ''
  }

  // Format fix suggestions with better structure for AI
  const formattedSuggestions = suggestions
    .map((suggestion, idx) => {
      // Clean up suggestion text and ensure it's actionable
      const cleanedSuggestion = suggestion.trim()
      return `### Fix ${idx + 1}:\n${cleanedSuggestion}`
    })
    .join('\n\n')

  const iterationHeader =
    `## Iteration ${iterationNumber} - Verification-Based Improvements\n\n` +
    `Based on the verification results from Iteration ${iterationNumber - 1}, the following improvements are suggested:\n\n`

  let result = `${iterationHeader}${formattedSuggestions}`

  // Add previous summary context if available for better AI understanding
  if (previousSummaryText) {
    result += `\n\n---\n\n## Context from Previous Iteration:\n\nPrevious summary: ${previousSummaryText.substring(0, 500)}${previousSummaryText.length > 500 ? '...' : ''}`
  }

  return result
}

/**
 * Extract failed structural tests from verification results
 *
 * @param verificationResult - Structural and behavioral verification results
 * @returns Array of failed structural test information
 */
export const extractFailedStructuralTests = (
  verificationResult: VerificationResponse | null
): Array<{
  checkName: string
  evidence: string
  location: string[]
  severity: string
  suggestions?: string[]
}> => {
  const failedTests: Array<{
    checkName: string
    evidence: string
    location: string[]
    severity: string
    suggestions?: string[]
  }> = []

  if (verificationResult?.structural?.checks) {
    verificationResult.structural.checks.forEach(check => {
      if (!check.passed) {
        failedTests.push({
          checkName: check.check_name,
          evidence: check.evidence || '',
          location: check.location || [],
          severity: check.severity || 'warning',
          suggestions: check.suggestions,
        })
      }
    })
  }

  return failedTests
}

/**
 * Compose iteration description from summary, event logs, business fixes, and failed structural tests
 * This replaces the user description when iterating after verification
 *
 * @param summary - Current process summary
 * @param eventLogSuggestions - Event log suggestions from previous iteration
 * @param businessSuggestions - Business fix suggestions from verification
 * @param verificationResult - Verification results containing structural tests
 * @param iterationNumber - Current iteration number
 * @returns Composed description string
 */
export const composeIterationDescription = (
  summary: ProcessSummaryApi | null,
  eventLogSuggestions: EventLogSuggestionsApi | null,
  businessSuggestions: string[],
  verificationResult: VerificationResponse | null,
  iterationNumber: number
): string => {
  const parts: string[] = []

  // Add summary text
  if (summary?.summary) {
    parts.push(`## Process Summary\n\n${summary.summary}`)
  }

  // Add event log suggestions
  if (eventLogSuggestions?.event_mappings && eventLogSuggestions.event_mappings.length > 0) {
    parts.push(`\n\n## Suggested Event Logs (Iteration ${iterationNumber - 1})\n\n`)
    eventLogSuggestions.event_mappings.forEach((mapping, idx) => {
      parts.push(`### Event ${idx + 1}: ${mapping.event_name}`)
      if (mapping.description) {
        parts.push(`**Description:** ${mapping.description}`)
      }
      if (mapping.source) {
        parts.push(`**Source:** ${mapping.source}`)
      }
      if (mapping.priority) {
        parts.push(`**Priority:** ${mapping.priority}`)
      }
      parts.push('') // Empty line between events
    })
  }

  // Add business fix suggestions
  if (businessSuggestions.length > 0) {
    parts.push(`\n\n## Business Rule Fixes (Iteration ${iterationNumber - 1})\n\n`)
    businessSuggestions.forEach((suggestion, idx) => {
      parts.push(`### Fix ${idx + 1}:\n${suggestion.trim()}\n`)
    })
  }

  // Add failed structural tests
  const failedStructuralTests = extractFailedStructuralTests(verificationResult)
  if (failedStructuralTests.length > 0) {
    parts.push(`\n\n## Failed Structural Tests (Iteration ${iterationNumber - 1})\n\n`)
    parts.push(`The following structural verification checks failed and must be addressed:\n\n`)
    failedStructuralTests.forEach((test, idx) => {
      parts.push(`### Failed Test ${idx + 1}: ${test.checkName}`)
      parts.push(`**Severity:** ${test.severity}`)
      if (test.location && test.location.length > 0) {
        parts.push(`**Location:** ${test.location.join(' → ')}`)
      }
      if (test.evidence) {
        parts.push(`**Evidence:** ${test.evidence}`)
      }
      if (test.suggestions && test.suggestions.length > 0) {
        parts.push(`**Suggestions:**`)
        test.suggestions.forEach(suggestion => {
          parts.push(`- ${suggestion}`)
        })
      }
      parts.push('') // Empty line between tests
    })
  }

  const composed = parts.join('\n')
  console.log('[composeIterationDescription] Composed description length:', composed.length)
  console.log(
    '[composeIterationDescription] Contains summary:',
    composed.includes('## Process Summary')
  )
  console.log(
    '[composeIterationDescription] Contains event logs:',
    composed.includes('## Suggested Event Logs')
  )
  console.log(
    '[composeIterationDescription] Contains business fixes:',
    composed.includes('## Business Rule Fixes')
  )
  console.log(
    '[composeIterationDescription] Contains failed structural tests:',
    composed.includes('## Failed Structural Tests')
  )

  return composed
}
