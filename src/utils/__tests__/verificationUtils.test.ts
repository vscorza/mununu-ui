/**
 * Tests for verification utility functions
 * Validates iteration description composition and failed structural test extraction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractFailedStructuralTests, composeIterationDescription } from '../verificationUtils'
import type { VerificationResponse } from '../../hooks/useVerification'
import type { components } from '../../api/types'

type ProcessSummaryApi = components['schemas']['ProcessSummaryApi']
type EventLogSuggestionsApi = components['schemas']['EventLogSuggestionsApi']

describe('verificationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractFailedStructuralTests', () => {
    it('should extract failed structural tests from verification results', () => {
      const verificationResult: VerificationResponse = {
        success: true,
        structural: {
          all_passed: false,
          available_checks: [
            {
              check_name: 'Start Event Check',
              description: 'Verifies that the process has at least one start event',
              severity: 'error',
            },
            {
              check_name: 'End Event Check',
              description: 'Verifies that the process has at least one end event',
              severity: 'error',
            },
          ],
          checks: [
            {
              check_name: 'Start Event Check',
              evidence: 'No start event found',
              location: ['Process', 'StartEvent'],
              passed: false,
              severity: 'error',
              suggestions: ['Add a start event to the process'],
            },
            {
              check_name: 'End Event Check',
              evidence: 'End event found',
              location: ['Process', 'EndEvent'],
              passed: true,
              severity: 'info',
            },
            {
              check_name: 'Gateway Check',
              evidence: 'Gateway has no outgoing flows',
              location: ['Process', 'Gateway1'],
              passed: false,
              severity: 'warning',
              suggestions: ['Add outgoing flows to gateway', 'Remove unused gateway'],
            },
          ],
          error_count: 1,
          warning_count: 1,
          info_count: 1,
        },
        behavioral: null,
        warnings: [],
      }

      const failedTests = extractFailedStructuralTests(verificationResult)

      expect(failedTests).toHaveLength(2)
      expect(failedTests[0]).toMatchObject({
        checkName: 'Start Event Check',
        evidence: 'No start event found',
        location: ['Process', 'StartEvent'],
        severity: 'error',
        suggestions: ['Add a start event to the process'],
      })
      expect(failedTests[1]).toMatchObject({
        checkName: 'Gateway Check',
        evidence: 'Gateway has no outgoing flows',
        location: ['Process', 'Gateway1'],
        severity: 'warning',
        suggestions: ['Add outgoing flows to gateway', 'Remove unused gateway'],
      })
    })

    it('should return empty array when no failed tests', () => {
      const verificationResult: VerificationResponse = {
        success: true,
        structural: {
          all_passed: true,
          available_checks: [
            {
              check_name: 'Start Event Check',
              description: 'Verifies that the process has at least one start event',
              severity: 'error',
            },
          ],
          checks: [
            {
              check_name: 'Start Event Check',
              evidence: 'Start event found',
              location: ['Process', 'StartEvent'],
              passed: true,
              severity: 'info',
            },
          ],
          error_count: 0,
          warning_count: 0,
          info_count: 1,
        },
        behavioral: null,
        warnings: [],
      }

      const failedTests = extractFailedStructuralTests(verificationResult)
      expect(failedTests).toHaveLength(0)
    })

    it('should return empty array when verification result is null', () => {
      const failedTests = extractFailedStructuralTests(null)
      expect(failedTests).toHaveLength(0)
    })

    it('should handle checks without suggestions', () => {
      const verificationResult: VerificationResponse = {
        success: true,
        structural: {
          all_passed: false,
          available_checks: [
            {
              check_name: 'Test Check',
              description: 'Test check description',
              severity: 'error',
            },
          ],
          checks: [
            {
              check_name: 'Test Check',
              evidence: 'Test evidence',
              location: ['Location1'],
              passed: false,
              severity: 'error',
            },
          ],
          error_count: 1,
          warning_count: 0,
          info_count: 0,
        },
        behavioral: null,
        warnings: [],
      }

      const failedTests = extractFailedStructuralTests(verificationResult)
      expect(failedTests).toHaveLength(1)
      expect(failedTests[0].suggestions).toBeUndefined()
    })
  })

  describe('composeIterationDescription', () => {
    const mockSummary: ProcessSummaryApi = {
      summary: 'This is a test process summary',
      confidence: 0.9,
      actors: [],
      decision_points: [],
      metadata: {
        model_used: 'test-model',
        processing_time_seconds: 1.5,
        source_length: 100,
        summary_length: 50,
        compression_ratio: 0.5,
      },
    }

    const mockEventLogSuggestions: EventLogSuggestionsApi = {
      event_mappings: [
        {
          event_name: 'Process Started',
          description: 'Event when process starts',
          source: 'user_action',
          priority: 'high',
          artifact_type: { LogFile: { format: 'json', path: '/var/log/start.log' } },
          artifact_config: {
            fields: [],
            retention: {
              duration_days: 30,
            },
          },
        },
        {
          event_name: 'Process Completed',
          description: 'Event when process completes',
          source: 'system',
          priority: 'medium',
          artifact_type: { LogFile: { format: 'json', path: '/var/log/complete.log' } },
          artifact_config: {
            fields: [],
            retention: {
              duration_days: 30,
            },
          },
        },
      ],
      infrastructure: {
        components: [],
        complexity: 1,
        compatibility_score: 1,
      },
      metadata: {
        events_mapped: 2,
        infrastructure_components: 0,
        model_used: 'test-model',
        processing_time_seconds: 0.5,
      },
    }

    const mockVerificationResult: VerificationResponse = {
      success: true,
      structural: {
        all_passed: false,
        available_checks: [
          {
            check_name: 'Start Event Check',
            description: 'Verifies that the process has at least one start event',
            severity: 'error',
          },
        ],
        checks: [
          {
            check_name: 'Start Event Check',
            evidence: 'No start event found',
            location: ['Process', 'StartEvent'],
            passed: false,
            severity: 'error',
            suggestions: ['Add a start event'],
          },
        ],
        error_count: 1,
        warning_count: 0,
        info_count: 0,
      },
      behavioral: null,
      warnings: [],
    }

    it('should compose description with summary, event logs, business fixes, and failed structural tests', () => {
      const businessSuggestions = ['Fix business rule 1', 'Fix business rule 2']
      const iterationNumber = 2

      const description = composeIterationDescription(
        mockSummary,
        mockEventLogSuggestions,
        businessSuggestions,
        mockVerificationResult,
        iterationNumber
      )

      // Check that all sections are present
      expect(description).toContain('## Process Summary')
      expect(description).toContain('This is a test process summary')
      expect(description).toContain('## Suggested Event Logs (Iteration 1)')
      expect(description).toContain('Process Started')
      expect(description).toContain('Process Completed')
      expect(description).toContain('## Business Rule Fixes (Iteration 1)')
      expect(description).toContain('Fix business rule 1')
      expect(description).toContain('Fix business rule 2')
      expect(description).toContain('## Failed Structural Tests (Iteration 1)')
      expect(description).toContain('Start Event Check')
      expect(description).toContain('No start event found')
      expect(description).toContain('Add a start event')
    })

    it('should include failed structural tests with all details', () => {
      const description = composeIterationDescription(
        mockSummary,
        null,
        [],
        mockVerificationResult,
        2
      )

      expect(description).toContain('## Failed Structural Tests (Iteration 1)')
      expect(description).toContain('Failed Test 1: Start Event Check')
      expect(description).toContain('**Severity:** error')
      expect(description).toContain('**Location:** Process → StartEvent')
      expect(description).toContain('**Evidence:** No start event found')
      expect(description).toContain('**Suggestions:**')
      expect(description).toContain('- Add a start event')
    })

    it('should handle multiple failed structural tests', () => {
      const verificationResult: VerificationResponse = {
        success: true,
        structural: {
          all_passed: false,
          available_checks: [
            {
              check_name: 'Test 1',
              description: 'Test check 1',
              severity: 'error',
            },
          ],
          checks: [
            {
              check_name: 'Test 1',
              evidence: 'Evidence 1',
              location: ['Loc1'],
              passed: false,
              severity: 'error',
              suggestions: ['Fix 1'],
            },
            {
              check_name: 'Test 2',
              evidence: 'Evidence 2',
              location: ['Loc2', 'SubLoc'],
              passed: false,
              severity: 'warning',
              suggestions: ['Fix 2a', 'Fix 2b'],
            },
          ],
          error_count: 1,
          warning_count: 1,
          info_count: 0,
        },
        behavioral: null,
        warnings: [],
      }

      const description = composeIterationDescription(mockSummary, null, [], verificationResult, 2)

      expect(description).toContain('Failed Test 1: Test 1')
      expect(description).toContain('Failed Test 2: Test 2')
      expect(description).toContain('Evidence 1')
      expect(description).toContain('Evidence 2')
      expect(description).toContain('Fix 2a')
      expect(description).toContain('Fix 2b')
    })

    it('should work with only summary', () => {
      const description = composeIterationDescription(mockSummary, null, [], null, 1)

      expect(description).toContain('## Process Summary')
      expect(description).toContain('This is a test process summary')
      expect(description).not.toContain('## Suggested Event Logs')
      expect(description).not.toContain('## Business Rule Fixes')
      expect(description).not.toContain('## Failed Structural Tests')
    })

    it('should handle null summary gracefully', () => {
      const description = composeIterationDescription(null, null, [], null, 1)

      expect(description).toBe('')
    })

    it('should handle failed tests without suggestions', () => {
      const verificationResult: VerificationResponse = {
        success: true,
        structural: {
          all_passed: false,
          available_checks: [
            {
              check_name: 'Test Check',
              description: 'Test check description',
              severity: 'error',
            },
          ],
          checks: [
            {
              check_name: 'Test Check',
              evidence: 'Test evidence',
              location: ['Location'],
              passed: false,
              severity: 'error',
            },
          ],
          error_count: 1,
          warning_count: 0,
          info_count: 0,
        },
        behavioral: null,
        warnings: [],
      }

      const description = composeIterationDescription(mockSummary, null, [], verificationResult, 2)

      expect(description).toContain('Failed Test 1: Test Check')
      expect(description).toContain('**Evidence:** Test evidence')
      expect(description).not.toContain('**Suggestions:**')
    })
  })
})
