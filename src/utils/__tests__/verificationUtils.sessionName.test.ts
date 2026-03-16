/**
 * Tests for session name generation utility
 */

import { describe, it, expect } from 'vitest'
import { generateNextIterationSessionName } from '../verificationUtils'

describe('generateNextIterationSessionName', () => {
  describe('names with trailing numbers', () => {
    it('should increment number at the end', () => {
      expect(generateNextIterationSessionName('Session 1', 2)).toBe('Session 2')
      expect(generateNextIterationSessionName('My Process-2', 3)).toBe('My Process-3')
      expect(generateNextIterationSessionName('Test_3', 4)).toBe('Test_4')
      expect(generateNextIterationSessionName('Process 10', 11)).toBe('Process 11')
    })

    it('should handle various separators', () => {
      expect(generateNextIterationSessionName('Session-1', 2)).toBe('Session-2')
      expect(generateNextIterationSessionName('Session_1', 2)).toBe('Session_2')
      expect(generateNextIterationSessionName('Session - 1', 2)).toBe('Session - 2')
      expect(generateNextIterationSessionName('Session _ 1', 2)).toBe('Session _ 2')
    })

    it('should preserve base name and separator', () => {
      expect(generateNextIterationSessionName('My Awesome Process - 5', 6)).toBe(
        'My Awesome Process - 6'
      )
      expect(generateNextIterationSessionName('Complex_Name-123', 124)).toBe('Complex_Name-124')
    })
  })

  describe('names without trailing numbers', () => {
    it('should add iteration suffix', () => {
      expect(generateNextIterationSessionName('My Session', 2)).toBe('My Session - Iteration 2')
      expect(generateNextIterationSessionName('Process', 3)).toBe('Process - Iteration 3')
      expect(generateNextIterationSessionName('Test Session Name', 4)).toBe(
        'Test Session Name - Iteration 4'
      )
    })

    it('should handle names with numbers in the middle', () => {
      expect(generateNextIterationSessionName('Process v1.0', 2)).toBe('Process v1.0 - Iteration 2')
      // "Session 2024" ends with a number, so it will be incremented (this is expected behavior)
      // If you want to preserve years/versions, use a different naming convention
      expect(generateNextIterationSessionName('Session 2024', 2)).toBe('Session 2025')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(generateNextIterationSessionName('', 1)).toBe(' - Iteration 1')
    })

    it('should handle single character names', () => {
      expect(generateNextIterationSessionName('A', 2)).toBe('A - Iteration 2')
      expect(generateNextIterationSessionName('A1', 2)).toBe('A2')
    })

    it('should handle very large numbers', () => {
      expect(generateNextIterationSessionName('Session 999', 1000)).toBe('Session 1000')
      expect(generateNextIterationSessionName('Process 10000', 10001)).toBe('Process 10001')
    })
  })
})
