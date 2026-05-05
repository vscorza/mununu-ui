import { apiClient, aiApiClient } from "./client";
import type { paths } from "./types";

// Context endpoint type aliases
type ContextSummarizeRequest =
  paths["/api/v1/context/summarize"]["post"]["requestBody"]["content"]["application/json"];
type ContextSummarizeResponse =
  paths["/api/v1/context/summarize"]["post"]["responses"]["200"]["content"]["application/json"];

type ContextGraphsRequest =
  paths["/api/v1/context/graphs"]["post"]["requestBody"]["content"]["application/json"] & {
    include_controllers?: boolean;
    minimize_controllers?: boolean;
  };
type ContextGraphsResponse =
  paths["/api/v1/context/graphs"]["post"]["responses"]["200"]["content"]["application/json"];

// Verification types (matches mununu backend /api/v1/context/verify)
export interface ContextVerifyRequest {
  context: { name: string; content: string };
  sidecars?: { name: string; content: string }[];
  formula?: string;
  /** Template reference (alternative to formula). */
  template_ref?: { template: string; args: Record<string, string> };
  automaton?: string;
  counterstrategy?: boolean;
  minimize_counterstrategy?: boolean;
  /** Labels to hide (reclassify as internal) before evaluation. */
  hide?: string[];
  /** Apply bisimulation minimization before evaluation. */
  minimize?: boolean;
  /** Stub .espec.json content to compose as sidecars. */
  stubs?: { name: string; content: string }[];
}

export interface GraphElementData {
  id: string;
  label?: string;
  parent?: string;
  source?: string;
  target?: string;
  action_type?: string;
  type?: string;
  [key: string]: unknown;
}

export interface GraphElement {
  data: GraphElementData;
  position?: { x: number; y: number };
  classes?: string;
}

export interface CounterstrategyResult {
  environment_winning_states: string[];
  graph_elements: GraphElement[];
  inverted_formula: string;
  minimized: boolean;
}

export interface FormulaVerificationResult {
  formula_name: string;
  automaton: string;
  satisfied: boolean;
  total_states: number;
  satisfying_states: number;
  initial_states: string[];
  initial_satisfying: string[];
  initial_violating: string[];
  satisfying_state_names: string[];
  counterstrategy?: CounterstrategyResult;
}

export interface ContextVerifyResponse {
  success: boolean;
  all_satisfied: boolean;
  results: FormulaVerificationResult[];
}

// Context endpoints
export const summarizeContext = async (
  request: ContextSummarizeRequest,
): Promise<ContextSummarizeResponse> => {
  const response = await apiClient.post<ContextSummarizeResponse>(
    "/context/summarize",
    request,
  );
  return response.data;
};

export const getContextGraphs = async (
  request: ContextGraphsRequest,
): Promise<ContextGraphsResponse> => {
  const response = await apiClient.post<ContextGraphsResponse>(
    "/context/graphs",
    request,
  );
  return response.data;
};

// Verification endpoint
// Uses extended timeout when counterstrategy is requested (formula inversion + evaluation)
export const verifyContext = async (
  request: ContextVerifyRequest,
): Promise<ContextVerifyResponse> => {
  const client = request.counterstrategy ? aiApiClient : apiClient;
  const response = await client.post<ContextVerifyResponse>(
    "/context/verify",
    request,
  );
  return response.data;
};

// Import types (matches mununu backend /api/v1/context/import)
export interface ContextImportRequest {
  content: string;
  format?: string; // "auto", "tlsf", "aiger", "promela", "xstate", "systemverilog", "extraction"
  filename?: string;
  /** Optional sidecar content (.mununu.json for SV, .espec.json for extraction). */
  sidecar?: string;
  /** Additional source files (for multi-module SV compositions). */
  additional_sources?: { name: string; content: string }[];
}

export interface ContextImportResponse {
  success: boolean;
  ctxdsl: string;
  source_format: string;
  warnings: string[];
  signal_count: number;
  state_count: number;
  property_count: number;
}

// Import endpoint — translate adapter formats to CTXDSL
export const importContext = async (
  request: ContextImportRequest,
): Promise<ContextImportResponse> => {
  const response = await apiClient.post<ContextImportResponse>(
    "/context/import",
    request,
  );
  return response.data;
};

// Adapter format file extensions that require translation via the import endpoint
export const ADAPTER_EXTENSIONS = [
  "sv",
  "v",
  "json",
  "xstate",
  "tlsf",
  "aag",
  "aig",
  "pml",
  "promela",
  "espec.json",
];

/**
 * Download content as a file in the browser.
 */
export const downloadAsFile = (
  content: string,
  fileName: string,
  mimeType: string = "text/plain",
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export controller output format options.
 */
export type ControllerExportFormat =
  | "ctxdsl"
  | "xstate"
  | "systemverilog"
  | "gdscript";

export const EXPORT_FORMAT_EXTENSIONS: Record<ControllerExportFormat, string> = {
  ctxdsl: ".ctxdsl",
  xstate: ".json",
  systemverilog: ".sv",
  gdscript: ".gd",
};

// Synthesis types (matches mununu backend /api/v1/context/synthesize)
type SynthesizeRequest =
  paths["/api/v1/context/synthesize"]["post"]["requestBody"]["content"]["application/json"];
type BaseSynthesizeResponse =
  paths["/api/v1/context/synthesize"]["post"]["responses"]["200"]["content"]["application/json"];

// Extend generated type with counterstrategy field added to the backend
export type SynthesizeResponse = BaseSynthesizeResponse & {
  counterstrategy?: CounterstrategyResult;
};

export type { SynthesizeRequest };

export interface LassoTrace {
  prefix: string[];
  cycle: string[];
  prefix_labels?: string[];
  cycle_labels?: string[];
}

// Synthesis endpoint
// Uses aiApiClient for extended timeout since synthesis can be slow
// Extraction endpoints

export interface DomainProfileInfo {
  name: string;
  language: string;
  description: string;
}

export interface ExtractionDomainsResponse {
  profiles: DomainProfileInfo[];
}

/** List available domain profiles for extraction. */
export const getExtractionDomains =
  async (): Promise<ExtractionDomainsResponse> => {
    const response = await apiClient.get<ExtractionDomainsResponse>(
      "/extraction/domains",
    );
    return response.data;
  };

/** Request for AST-based extraction from source code. */
export interface ExtractionExtractRequest {
  config: string;
  source: string;
  language?: string;
}

/** Response from AST-based extraction. */
export interface ExtractionExtractResponse {
  success: boolean;
  espec: string;
  warnings: string[];
  automata: { id: string; state_count: number; transition_count: number }[];
}

/**
 * Phase B — concurrency-idiom finding produced by `proposeComposition`.
 * Mirrors the Rust `DetectedConcurrency` struct. Each finding is
 * suggestion-grade; the caller reviews before promoting it into a
 * `composition.instances[]` block.
 */
export interface DetectedConcurrency {
  /** Identifier of the detector (e.g., `python_asyncio_gather`). */
  detector_id: string;
  /** Short human-readable description of the finding. */
  description: string;
  /** Source line of the detected call (1-indexed). */
  line: number;
  /** Number of parallel branches detected, when known. */
  branch_count: number | null;
  /** Suggested instance names for the proposed composition. */
  suggested_instance_names: string[];
  /** Class name hint, when the detector could infer one. */
  suggested_class_hint: string | null;
}

export interface ProposeCompositionRequest {
  source: string;
  language: string;
}

export interface ProposeCompositionResponse {
  findings: DetectedConcurrency[];
}

/**
 * Scan source for concurrency idioms and return per-call-site
 * suggestions for a `composition.instances[]` block. Pre-pass for
 * the `compose` workflow step — caller decides whether to apply.
 */
export const proposeComposition = async (
  request: ProposeCompositionRequest,
): Promise<ProposeCompositionResponse> => {
  const response = await apiClient.post<ProposeCompositionResponse>(
    "/extraction/propose-composition",
    request,
  );
  return response.data;
};

/** Extract a model from source code using the AST-based pipeline. */
export const extractSource =
  async (
    request: ExtractionExtractRequest,
  ): Promise<ExtractionExtractResponse> => {
    const response = await apiClient.post<ExtractionExtractResponse>(
      "/extraction/extract",
      request,
    );
    return response.data;
  };

export const synthesizeContext = async (
  request: SynthesizeRequest,
): Promise<SynthesizeResponse> => {
  const response = await aiApiClient.post<SynthesizeResponse>(
    "/context/synthesize",
    request,
  );
  return response.data;
};

// ============================================================================
// SV Init / Discover Endpoints
// ============================================================================

export interface SvInitRequest {
  source: { name: string; content: string };
  additional_sources?: { name: string; content: string }[];
}

export interface SvSignalInfo {
  name: string;
  width: number;
  abstraction: string;
  preserve: boolean;
  note: string | null;
}

export interface SvInputInfo {
  name: string;
  abstraction: string;
}

export interface SvInitResponse {
  success: boolean;
  sidecar: string;
  schema: string;
  signals: SvSignalInfo[];
  inputs: SvInputInfo[];
  warnings: string[];
}

/** Generate a .mununu.json sidecar from SystemVerilog source. */
export const svInit = async (
  request: SvInitRequest,
): Promise<SvInitResponse> => {
  const response = await apiClient.post<SvInitResponse>("/sv/init", request);
  return response.data;
};

export interface SvDiscoverRequest {
  source: { name: string; content: string };
  sidecar: string;
}

export interface SvDiscoveryResult {
  signal: string;
  values_found: number;
}

export interface SvDiscoverResponse {
  success: boolean;
  sidecar: string;
  discoveries: SvDiscoveryResult[];
  smt_available: boolean;
  warnings: string[];
}

/** Run SMT-based value discovery for SV registers. Uses extended timeout. */
export const svDiscover = async (
  request: SvDiscoverRequest,
): Promise<SvDiscoverResponse> => {
  const response = await aiApiClient.post<SvDiscoverResponse>(
    "/sv/discover",
    request,
  );
  return response.data;
};

// ============================================================================
// Extraction Validate Endpoint
// ============================================================================

export interface ExtractionValidateRequest {
  spec: string;
  source: string;
  drift_window?: number;
}

export interface ValidationSummary {
  total: number;
  exact: number;
  drifted: number;
  mismatch: number;
  error: number;
  uncovered_accesses: number;
}

export interface AnchorResult {
  id: string;
  section: string;
  status: "exact" | "drifted" | "mismatch" | "error";
  line: number | null;
  found_line: number | null;
  message: string | null;
}

export interface UncoveredAccess {
  line: number;
  field: string;
  content: string;
}

export interface ExtractionValidateResponse {
  success: boolean;
  summary: ValidationSummary;
  anchors: AnchorResult[];
  uncovered: UncoveredAccess[];
  commit_match: boolean | null;
}

/** Validate extraction spec line anchors against source code. */
export const validateExtraction = async (
  request: ExtractionValidateRequest,
): Promise<ExtractionValidateResponse> => {
  const response = await apiClient.post<ExtractionValidateResponse>(
    "/extraction/validate",
    request,
  );
  return response.data;
};

// ============================================================================
// Context Predicates Endpoint
// ============================================================================

export interface ContextPredicatesRequest {
  context: { name: string; content: string };
  sidecars?: { name: string; content: string }[];
  automaton?: string;
}

export interface ContextPredicatesResponse {
  success: boolean;
  predicates: Record<string, string[]>;
}

/** List guard predicates per automaton. */
export const getContextPredicates = async (
  request: ContextPredicatesRequest,
): Promise<ContextPredicatesResponse> => {
  const response = await apiClient.post<ContextPredicatesResponse>(
    "/context/predicates",
    request,
  );
  return response.data;
};

