/**
 * Unified extraction workflow definitions.
 *
 * Each domain (RTL, software extraction, XState, etc.) is described as a
 * data-driven WorkflowDefinition with ordered steps. The UI renders the
 * workflow generically from these definitions — adding a new domain
 * requires only a new entry in WORKFLOW_REGISTRY.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type StepTimeout = "standard" | "extended";

export interface WorkflowStep {
  /** Unique step identifier within the workflow. */
  id: string;
  /** Human-readable label shown in the stepper. */
  label: string;
  /** Longer description for tooltips / help text. */
  description: string;
  /** API endpoint to call (relative to /api/v1), or null for client-side steps. */
  endpoint: string | null;
  /** Whether this step can be skipped. */
  optional: boolean;
  /** Whether this step can be re-run after completion. */
  repeatable: boolean;
  /** Step IDs that must be completed before this step is available. */
  requires: string[];
  /** Which HTTP client to use: "standard" (10s) or "extended" (120s). */
  timeout: StepTimeout;
}

export interface WorkflowDefinition {
  /** Unique domain identifier. */
  domain: string;
  /** Human-readable name. */
  displayName: string;
  /** Short description of what this domain covers. */
  description: string;
  /** File extensions that trigger this workflow. */
  sourceExtensions: string[];
  /** JSON Schema path for the sidecar editor (null if no sidecar). */
  sidecarSchema: string | null;
  /** Sidecar file extension for display. */
  sidecarExtension: string;
  /** Ordered workflow steps. */
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// Domain workflow definitions
// ---------------------------------------------------------------------------

const rtlWorkflow: WorkflowDefinition = {
  domain: "rtl",
  displayName: "SystemVerilog RTL",
  description:
    "Hardware register-transfer-level verification. Builds Kripke structures from registers and combinational logic.",
  sourceExtensions: [".sv", ".v"],
  sidecarSchema: "/schemas/mununu-sv-annotation.schema.json",
  sidecarExtension: ".mununu.json",
  steps: [
    {
      id: "load",
      label: "Load Source",
      description: "Load a SystemVerilog source file (.sv / .v)",
      endpoint: null,
      optional: false,
      repeatable: false,
      requires: [],
      timeout: "standard",
    },
    {
      id: "init",
      label: "Initialize Sidecar",
      description:
        "Auto-detect signals, inputs, and generate a .mununu.json sidecar with sensible defaults",
      endpoint: "/sv/init",
      optional: false,
      repeatable: true,
      requires: ["load"],
      timeout: "standard",
    },
    {
      id: "discover",
      label: "SMT Discovery",
      description:
        "Find significant register values via Z3 SMT solver. Updates the sidecar with discovered values.",
      endpoint: "/sv/discover",
      optional: true,
      repeatable: true,
      requires: ["init"],
      timeout: "extended",
    },
    {
      id: "edit_sidecar",
      label: "Edit Sidecar",
      description:
        "Refine signal abstractions, properties, and controllability in the .mununu.json sidecar",
      endpoint: null,
      optional: true,
      repeatable: true,
      requires: ["init"],
      timeout: "standard",
    },
    {
      id: "translate",
      label: "Translate",
      description:
        "Generate CTXDSL from SystemVerilog + sidecar. Builds the Kripke structure.",
      endpoint: "/context/import",
      optional: false,
      repeatable: true,
      requires: ["init"],
      timeout: "standard",
    },
    {
      id: "verify",
      label: "Verify",
      description: "Evaluate properties against the generated model",
      endpoint: "/context/verify",
      optional: false,
      repeatable: true,
      requires: ["translate"],
      timeout: "extended",
    },
  ],
};

const softwareWorkflow: WorkflowDefinition = {
  domain: "software",
  displayName: "Software Extraction",
  description:
    "Extract state machines from TypeScript, Python, or Rust source code via AST analysis.",
  sourceExtensions: [".ts", ".tsx", ".py", ".rs"],
  sidecarSchema: "/schemas/extraction-spec.schema.json",
  sidecarExtension: ".espec.json",
  steps: [
    {
      id: "load",
      label: "Load Source",
      description: "Load a source file to extract from",
      endpoint: null,
      optional: false,
      repeatable: false,
      requires: [],
      timeout: "standard",
    },
    {
      id: "extract",
      label: "Extract Model",
      description:
        "AST-based extraction: identify state fields, methods, guards, and effects",
      endpoint: "/extraction/extract",
      optional: false,
      repeatable: true,
      requires: ["load"],
      timeout: "standard",
    },
    {
      id: "validate",
      label: "Validate Anchors",
      description:
        "Check that line anchors in the extraction spec still match the source code",
      endpoint: "/extraction/validate",
      optional: true,
      repeatable: true,
      requires: ["extract"],
      timeout: "standard",
    },
    {
      id: "edit_sidecar",
      label: "Edit Spec",
      description: "Refine the .espec.json: adjust transitions, properties, mode filtering",
      endpoint: null,
      optional: true,
      repeatable: true,
      requires: ["extract"],
      timeout: "standard",
    },
    {
      id: "translate",
      label: "Translate",
      description: "Generate CTXDSL from the extraction spec",
      endpoint: "/context/import",
      optional: false,
      repeatable: true,
      requires: ["extract"],
      timeout: "standard",
    },
    {
      id: "verify",
      label: "Verify",
      description: "Evaluate properties against the extracted model",
      endpoint: "/context/verify",
      optional: false,
      repeatable: true,
      requires: ["translate"],
      timeout: "extended",
    },
  ],
};

const xstateWorkflow: WorkflowDefinition = {
  domain: "xstate",
  displayName: "XState / Statecharts",
  description:
    "Verify XState state machine definitions. Supports hierarchy flattening and parallel regions.",
  sourceExtensions: [".xstate.json", ".xstate"],
  sidecarSchema: null,
  sidecarExtension: "",
  steps: [
    {
      id: "load",
      label: "Load Machine",
      description: "Load an XState JSON state machine definition",
      endpoint: null,
      optional: false,
      repeatable: false,
      requires: [],
      timeout: "standard",
    },
    {
      id: "translate",
      label: "Translate",
      description: "Flatten hierarchy and generate CTXDSL",
      endpoint: "/context/import",
      optional: false,
      repeatable: true,
      requires: ["load"],
      timeout: "standard",
    },
    {
      id: "verify",
      label: "Verify",
      description: "Evaluate properties against the state machine",
      endpoint: "/context/verify",
      optional: false,
      repeatable: true,
      requires: ["translate"],
      timeout: "extended",
    },
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Registry of all available extraction workflows.
 *
 * To add a new domain:
 * 1. Define a WorkflowDefinition (like rtlWorkflow above)
 * 2. Add it to this map
 * 3. Optionally add a sidecar JSON Schema to /public/schemas/
 *
 * The DomainSelector component renders from this registry automatically.
 */
export const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  rtl: rtlWorkflow,
  software: softwareWorkflow,
  xstate: xstateWorkflow,
};

/**
 * Get a workflow definition by domain name.
 */
export function getWorkflow(domain: string): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY[domain];
}

/**
 * List all available domain names.
 */
export function availableDomains(): string[] {
  return Object.keys(WORKFLOW_REGISTRY);
}
