---
name: frontend-review
description: >
  Reviews React/TypeScript code for component patterns, hooks correctness,
  type safety, accessibility, and performance.
  Use when asked to review, audit, or check frontend code quality.
---

Perform a frontend best-practices review of $ARGUMENTS (or changed files via `git diff --name-only HEAD~1 HEAD | grep -E '\.(tsx?|jsx?)$'` if no args).

This is a React 19 + TypeScript 5.7 app built with Vite 7, using Monaco Editor, Cytoscape/ReactFlow for visualization, and Zustand for state management.

## Review Checklist

1. **React Patterns**:
   - Components should be functional with hooks — no class components
   - Custom hooks in `hooks/` must follow `use*` naming and Rules of Hooks
   - Avoid prop drilling — use Zustand stores or context for deeply shared state
   - Check `useEffect` dependencies are complete and don't cause infinite loops
   - `useMemo`/`useCallback` should only be used when there's a measurable perf need, not preemptively

2. **TypeScript Strictness**:
   - No `any` types — use `unknown` and narrow with type guards
   - Prefer discriminated unions over optional fields for variant types
   - API response types should match the OpenAPI spec (`openapi-typescript` generated types)
   - Props interfaces should be exported alongside components

3. **State Management (Zustand)**:
   - Store slices should be focused (single responsibility)
   - Selectors should be used to prevent unnecessary re-renders
   - No derived state stored in stores — compute it in selectors or components

4. **Monaco Editor Integration**:
   - Check that editor instances are properly disposed on unmount
   - Language server configurations should not leak between editor instances
   - Custom CTXDSL language support must stay in sync with the backend parser

5. **Visualization (Cytoscape/ReactFlow)**:
   - Graph layout calculations should not block the main thread for large automata
   - Check that node/edge data structures match backend API response shapes

6. **Performance**:
   - Large lists should use virtualization
   - Heavy computations (graph layout, syntax highlighting) should be debounced or run in workers
   - Check bundle impact of imports — prefer tree-shakeable imports

7. **Accessibility**:
   - Interactive elements must have keyboard support and ARIA labels
   - Color is not the only indicator for state (realizability verdicts, errors)
   - Monaco editor alternatives for screen readers

## Output Format

Group findings as: **Critical** / **Warning** / **Suggestion** — with `file_path:line_number` references.
