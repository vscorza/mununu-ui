# Mununu UI

Web interface for the Mununu CLTS verification tool.

## Prerequisites

- Node.js 18+ and npm
- The Mununu Rust backend running (optional, for API features)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install pre-commit hooks:
   ```bash
   ./scripts/setup-hooks.sh
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - Type check without emitting

## Project Structure

```
mununu-ui/
├── src/
│   ├── api/                  # API client and endpoints
│   ├── components/
│   │   ├── common/           # Shared UI components
│   │   ├── editors/          # DSL editor (Monaco)
│   │   ├── layout/           # App layout
│   │   ├── verification/     # Verification results
│   │   ├── visualization/    # Graph views, traces
│   │   └── workflows/        # Verification & synthesis workflows
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # Internationalization
│   ├── monaco/               # Monaco editor ctxdsl support
│   ├── pages/                # Page components
│   ├── services/             # Analytics, offline support
│   ├── store/                # Zustand state management
│   └── tutorials/            # Interactive tutorials
├── public/
├── scripts/
│   ├── pre-commit            # Pre-commit hook
│   └── setup-hooks.sh        # Hook installer
└── index.html
```

## Features

- **DSL Editor**: Monaco-based editor with ctxdsl syntax highlighting
- **Verification Workflow**: Evaluate mu-calculus formulas over CLTS models
- **Synthesis Workflow**: Synthesize controllers with diagnostics
- **Graph Visualization**: Interactive Cytoscape/React Flow graph views
- **Counterexample Viewer**: Trace and counterexample visualization
- **Internationalization**: English, Spanish, Portuguese

## Testing

```bash
npm run test           # Run tests
npm run test:coverage  # With coverage
```
