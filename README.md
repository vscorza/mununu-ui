# HENOS Web Client

Web client for interacting with the HENOS HTTP API server.

## Prerequisites

- Node.js 18+ and npm
- The HENOS Rust server running (or access to the OpenAPI spec)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set `VITE_API_URL` to your HENOS server URL (default: `http://localhost:8080/api/v1`)

3. Generate TypeScript types from OpenAPI spec:
   ```bash
   # First, ensure the server is running and fetch the OpenAPI spec:
   curl http://localhost:8080/api/v1/openapi.json -o public/openapi.json
   
   # Then generate types:
   npm run generate:types
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
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ui` - Run tests with UI
- `npm run type-check` - Type check without emitting
- `npm run audit` - Run security audit
- `npm run generate:types` - Generate TypeScript types from OpenAPI spec

## CI/CD

The project includes GitHub Actions workflows for:
- Format checking (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Testing (Vitest)
- Security audit (npm audit)

## Project Structure

```
henos-web/
├── src/
│   ├── api/
│   │   ├── client.ts          # API client configuration
│   │   ├── types.ts           # Generated TypeScript types (from OpenAPI)
│   │   ├── endpoints.ts       # API endpoint functions
│   │   └── __tests__/         # API tests
│   ├── components/            # React components
│   ├── test/                  # Test setup
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── openapi.json           # OpenAPI spec from henos-rust
├── docs/
│   └── api/                   # API documentation
└── .github/
    └── workflows/
        └── ci.yml             # CI workflow
```

## Features

### Process Context Workflow

An AI-powered iterative workflow for capturing, refining, and verifying business processes:

- **Context Configuration**: Define business domain and constraints
- **Process Description**: Natural language process capture
- **Summary Refinement**: Interactive Q&A for process refinement
- **Event Log Integration**: Suggestions for process instrumentation
- **Visualization**: Interactive BPMN diagrams and IR model visualization
- **Verification**: Structural, behavioral, and business rule verification
- **Iterative Refinement**: Multi-iteration workflow with comparison
- **Session Management**: Save and resume workflow sessions

See [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) for detailed user guide.

### Validation and Error Handling

- **Validation Summary**: Quick overview of all validation issues
- **Detailed Validation Results**: Categorized errors and warnings
- **Rate Limit Handling**: Automatic retry with countdown
- **Correlation ID Tracking**: Debug support with correlation IDs
- **Progress Indicators**: Detailed progress for long-running operations

### Event Log Integration

- **Event Selection**: Choose which events to track
- **Event Mappings**: See how events map to IR elements
- **Infrastructure Suggestions**: Get infrastructure recommendations
- **Cost Estimation**: Estimate costs for event logging

## API Endpoints

The client supports the following HENOS API endpoints:

- `GET /api/v1/health` - Health check
- `POST /api/v1/translate/bpm` - Translate BPMN to ctxdsl
- `POST /api/v1/context/summarize` - Summarize context
- `POST /api/v1/context/synthesize` - Synthesize controller
- `POST /api/v1/context/graphs` - Generate graph visualization data
- `POST /api/v1/process/context/summarize` - Summarize use context
- `POST /api/v1/process/context/event-logs` - Suggest event log mappings
- `POST /api/v1/process/context/extract-ir` - Extract IR from summary
- `POST /api/v1/bpm/verify/all` - Verify BPMN process
- `POST /api/v1/bpm/verify/business` - Verify business rules

See [docs/api/README.md](./docs/api/README.md) for detailed API documentation.

## Testing

Run tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Documentation

- [User Guide](./docs/USER_GUIDE.md) - Complete guide to using the Process Context Workflow
- [API Documentation](./docs/api/README.md) - API endpoint documentation
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Development implementation plan
- [Implementation Progress](./docs/IMPLEMENTATION_PROGRESS.md) - Progress tracking

## Implementation Plan

See [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for the full implementation plan for API interface support.

## Recent Updates

### Phase 1-6 Complete ✅

All phases of the implementation plan have been completed:

- **Phase 1**: Type generation and API integration
- **Phase 2**: Iterative workflow UI
- **Phase 3**: Enhanced business verification
- **Phase 4**: Event log integration
- **Phase 5**: Error handling and UX improvements
- **Phase 6**: Documentation and testing

See [docs/IMPLEMENTATION_PROGRESS.md](./docs/IMPLEMENTATION_PROGRESS.md) for detailed progress.

