---
name: test-review
description: >
  Audits test coverage and test quality for the React/TypeScript UI.
  Use when asked to review tests or check coverage.
---

Audit test coverage for $ARGUMENTS (or the full project if no args).

## Testing Infrastructure

- **Runner**: Vitest 4
- **Component testing**: `@testing-library/react` + `@testing-library/user-event`
- **Assertions**: `@testing-library/jest-dom`
- **Coverage**: `@vitest/coverage-v8`
- **Commands**: `npm test`, `npm run test:coverage`, `npm run test:ui`

## Review Checklist

1. **Component coverage**: check each component in `src/components/` has a corresponding test file (`.test.tsx` or `.spec.tsx`). Flag components with no tests, especially:
   - Editor components (Monaco integration)
   - Visualization components (Cytoscape/ReactFlow)
   - API-dependent components

2. **Test quality**:
   - Tests should use `screen.getByRole()` / `getByLabelText()` over `getByTestId()` (accessibility-first queries)
   - User interactions via `userEvent` not `fireEvent` (more realistic)
   - Async operations properly awaited with `waitFor` / `findBy*`
   - Mock API responses should match actual backend shapes

3. **Store tests**: Zustand stores in `src/store/` should have isolated tests verifying:
   - Initial state
   - Action dispatches produce correct state transitions
   - Selectors return expected derived values

4. **Hook tests**: custom hooks in `src/hooks/` should be tested with `renderHook`

5. **Edge cases**:
   - Empty states (no automata loaded, no verification results)
   - Error states (API failures, malformed CTXDSL)
   - Large inputs (automata with many states — does the UI handle it gracefully?)

6. **Type-check alignment**: verify `npm run type-check` passes alongside tests

## Output Format

Coverage gaps by module, priority-ordered. Include specific test scenarios to add.
