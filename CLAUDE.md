# CLAUDE.md — Project Instructions for Claude Code

## Project Overview

Mununu UI is a React/TypeScript interface for the Mununu CLTS verification tool. Features include DSL editing with Monaco editor, verification workflows, controller synthesis, and graph visualization.

## Build Commands

```bash
npm run dev          # Development server
npm run build        # Production build (type-check + vite build)
npm run lint         # ESLint
npm run format:check # Prettier
npm run test         # Vitest
npm run type-check   # TypeScript type checking
```

## Pre-commit Hooks

Tests MUST run in pre-commit hooks. Install with:

```bash
./scripts/setup-hooks.sh
```

The pre-commit hook runs: type-check, lint, and tests.

## Architecture

```
src/
├── api/              # API client and endpoint definitions
├── components/
│   ├── common/       # Shared UI components (Button, Modal, Tabs, etc.)
│   ├── editors/      # CtxdslEditor (Monaco-based DSL editor)
│   ├── layout/       # MainLayout, Header, Sidebar
│   ├── verification/ # Verification results display
│   ├── visualization/# Graph views, trace viewer, counterexamples
│   └── workflows/    # VerificationWorkflow, SynthesisWorkflow
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization (en, es, pt)
├── monaco/           # Monaco editor ctxdsl language support
├── pages/            # Page components
├── services/         # Analytics, offline support
├── store/            # Zustand state management
├── styles/           # CSS variables and themes
├── tutorials/        # Interactive tutorial system
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Tech Stack

- React 19, TypeScript, Vite 7
- TailwindCSS for styling
- Monaco Editor for CLTS DSL editing
- Cytoscape/Dagre for graph visualization
- React Flow for node-based visualization
- Zustand for state management
- Vitest for testing

## Governance Rules

### Testing Best Practices

- Write test names that describe behavior.
- Pre-commit hook is the primary CI gate.
- Use Testing Library for component tests.

### Code Reuse

- Check existing hooks/components before creating new ones.
- Prefer established libraries over hand-rolling.

### Dead Code & Dependency Hygiene

- Remove unused imports and components promptly.
- Do not leave "just in case" packages.
