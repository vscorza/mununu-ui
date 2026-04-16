# CLAUDE.md — Project Instructions for Claude Code

## Project Overview

Mununu UI is a React/TypeScript interface for the Mununu CLTS verification tool. Features include DSL editing with Monaco editor, unified verification with counterstrategy graphs and countertraces, and graph visualization with controllable/uncontrollable edge styling.

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

### API Timeout Awareness

The UI defines two HTTP clients:
- **`apiClient`**: 10-second timeout — used for standard operations (eval, summarize, graph).
- **`aiApiClient`**: 120-second timeout — reserved for explicitly heavy operations (counterstrategy, synthesis).

When adding new API calls, always use `apiClient` unless the endpoint is known to be expensive. Never use the extended client for informational/summary endpoints.

### Docker Best Practices

When writing or reviewing Dockerfiles for this project (React/Vite SPA):

- **Multi-stage builds**: Use a `node` builder image to compile, then serve the static output from a slim runtime (`nginx:alpine` or equivalent). Build tools stay in the build stage; the production image serves only static files.
- **Pin exact tags**: Never use `FROM node:latest`. Use `FROM node:22.11-alpine3.20` — builds must stay reproducible.
- **Combine RUN commands**: Chain with `&&` and clean up in the same layer: `RUN apk add --no-cache curl && rm -rf /var/cache/apk/*`.
- **Always use `.dockerignore`**: Exclude `node_modules/`, `.git/`, `.env*`, `dist/` (if pre-built outside Docker), `*.local` from the build context to avoid leaking secrets and bloating the context.
- **Never run as root**: Use the built-in `node` user or add `RUN adduser -D appuser` and `USER appuser` before the entrypoint.
- **Order layers by change frequency**: Copy `package.json` and `package-lock.json` first and run `npm ci`, then copy source. Cache only busts when dependencies change, not on every source edit.
- **Add a HEALTHCHECK**: For nginx-based images: `HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:80/ || exit 1`.
- **Use ARG vs ENV correctly**: `ARG` for build-time values (e.g. `VITE_API_URL` injected at build time). `ENV` is baked into the image — never put secrets in `ENV`; use runtime injection for sensitive values.

### Security (Frontend)

- Never interpolate untrusted content into `dangerouslySetInnerHTML` or dynamic `eval`.
- Sanitize any user-generated content before rendering (XSS prevention).
- Never log tokens, credentials, or PII to the browser console.
- Use CSP headers in production deployments.
