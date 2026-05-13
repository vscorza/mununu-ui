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
  format?: string; // "auto", "tlsf", "aiger", "btor2", "promela", "xstate", "systemverilog" (hand-written), "sv-yosys" (Yosys-driven), "extraction"
  filename?: string;
  /** Optional sidecar content (.mununu.json for SV, .espec.json for extraction). */
  sidecar?: string;
  /** Additional source files (for multi-module SV compositions). */
  additional_sources?: { name: string; content: string }[];
}

/**
 * One per-transition observation row from an adapter that exposes
 * Mealy-style outputs. Display-only metadata: the formal evaluator
 * never consults these, but the UI trace renderer matches a row to
 * a CLTS transition by `(source, target)` and shows the observed
 * signal values per cycle in counterexample / counterstrategy traces.
 */
export interface TransitionObservation {
  source: string;
  target: string;
  labels: string[];
  observations: Record<string, string>;
}

export interface ContextImportResponse {
  success: boolean;
  ctxdsl: string;
  source_format: string;
  warnings: string[];
  signal_count: number;
  state_count: number;
  property_count: number;
  /**
   * Per-state structured valuations from cross-product enumeration —
   * keyed by `automaton_name → state_name → { variable: value }`.
   * Populated by the SystemVerilog Kripke builder, the BTOR2 reader,
   * and the extraction adapter.
   */
  state_valuations?: Record<string, Record<string, Record<string, string>>>;
  /**
   * Per-transition Mealy observations — keyed by `automaton_name →
   * list of `TransitionObservation`. Populated by the BTOR2 reader
   * for designs whose outputs depend on `(state, input)`.
   */
  transition_observations?: Record<string, TransitionObservation[]>;
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
  "btor",
  "btor2",
  "pml",
  "promela",
  "espec.json",
];

/**
 * Adapter format identifiers accepted by the /context/import endpoint.
 * Keep in sync with mununu-core's `auto_translate` and CLI dispatch.
 */
export const ADAPTER_FORMATS = [
  "auto",
  "tlsf",
  "aiger",
  "btor2",
  "promela",
  "xstate",
  "systemverilog",
  "sv-yosys",
  "extraction",
] as const;
export type AdapterFormat = (typeof ADAPTER_FORMATS)[number];

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

export const EXPORT_FORMAT_EXTENSIONS: Record<ControllerExportFormat, string> =
  {
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
 *
 * Uses a 30s per-request timeout (override of apiClient's 10s
 * default). The detector is fast in release builds, but tree-sitter
 * parsing on larger sources (or dev/debug backends) can exceed 10s
 * — surfacing as ECONNABORTED on the client. 30s covers both cases
 * without falling all the way back to aiApiClient's 120s, which is
 * reserved for genuinely heavy operations (synthesis,
 * counterstrategy).
 */
export const proposeComposition = async (
  request: ProposeCompositionRequest,
): Promise<ProposeCompositionResponse> => {
  const response = await apiClient.post<ProposeCompositionResponse>(
    "/extraction/propose-composition",
    request,
    { timeout: 30000 },
  );
  return response.data;
};

/** Extract a model from source code using the AST-based pipeline. */
export const extractSource = async (
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

// ============================================================================
// Contract Validate Endpoint (Document A §3.x discharge check)
// ============================================================================

export type ContractClauseKind = "assumption" | "guarantee" | "invariant";

export type ContractClauseProvenance =
  | "user_authored"
  | { corpus: { id: string } }
  | "source_comment"
  | "mununu_proposed"
  | "vendor_contract"
  | "unknown";

export interface ContractClause {
  id: string;
  kind: ContractClauseKind;
  owner: string;
  description?: string | null;
  provenance?: ContractClauseProvenance;
  /** Optional mu-calculus rank used by the lightweight McMillan check. */
  mu_rank?: number | null;
}

export interface DischargeEdge {
  discharger: string;
  dischargee: string;
}

export interface ContractSet {
  clauses: ContractClause[];
  discharges: DischargeEdge[];
  environment_assumptions: string[];
}

export interface RankWitnessedCycle {
  cycle: string[];
  base_edge: [string, string];
}

export type DischargeVerdict =
  | {
      kind: "acyclic";
      topological: string[];
      unmet_environment: string[];
    }
  | {
      kind: "circular_with_rank_witness";
      cycles: RankWitnessedCycle[];
      acyclic_remainder: string[];
    }
  | {
      kind: "circular";
      cycles: string[][];
      acyclic_remainder: string[];
    }
  | {
      kind: "potentially_circular";
      unresolved: string[];
      partial: DischargeVerdict;
    }
  | {
      kind: "unmet";
      missing_dischargers: string[];
      partial: DischargeVerdict;
    };

// ============================================================================
// Contract Discover Endpoint (Document A §A5 phase 1)
// ============================================================================

export type BoundaryDirection = "Input" | "Output" | "Inout" | "Internal";

export interface PortDescriptor {
  name: string;
  direction: BoundaryDirection;
  description?: string | null;
}

/**
 * Recognised `@mununu_*` tag from the §D.5 source-comment annotation
 * grammar. Sent back from the server as part of `BlackBoxInterface`
 * so the UI can show vendor-declared assumptions / guarantees /
 * interface URIs without round-tripping through CTXDSL.
 */
export type MununuTag =
  | "blackbox"
  | "assume"
  | "guarantee"
  | "interface"
  | "controllable"
  | "uncontrollable";

export interface MununuAnnotation {
  tag: MununuTag;
  value: string;
  source_line?: number | null;
}

export interface BlackBoxInterface {
  name: string;
  ports: PortDescriptor[];
  source_file?: string | null;
  source_line?: number | null;
  /** Source-comment annotations attached to this module (D §D.5). */
  annotations?: MununuAnnotation[];
}

export interface InterfaceLabel {
  name: string;
  controllability: "Controllable" | "Internal" | "Uncontrollable";
  direction: BoundaryDirection;
  description: string | null;
}

export type GapKind =
  | "output_sequencing"
  | "latency_bound"
  | "input_assumption"
  | "state_predicate"
  | "fairness"
  | "other";

export interface SourceLocation {
  file: string;
  line: number;
}

export interface GapMarker {
  module: string;
  kind: GapKind;
  labels: string[];
  description?: string | null;
  source_location?: SourceLocation | null;
}

/**
 * Parsed shape of a `contract://<domain>/<name>[@<version>][?alt=<id>]`
 * URI carried on an `@mununu_interface` annotation.
 */
export interface ContractUri {
  domain: string;
  name: string;
  version?: string | null;
  alternative?: string | null;
  raw: string;
}

export type ResolutionStatus =
  | "resolved"
  | "not_found"
  | "no_corpus"
  | "malformed"
  | "sidecar_reference";

/**
 * Outcome of resolving a single `@mununu_interface contract://` URI
 * against the supplied corpus during phase-2 discovery.
 */
export interface CorpusResolution {
  raw_uri: string;
  parsed: ContractUri;
  status: ResolutionStatus;
  matched_ids: string[];
  alternative_matched?: boolean | null;
}

export interface GapMarkerReport {
  markers: GapMarker[];
}

export interface Phase1Output {
  module: string;
  labels: InterfaceLabel[];
  gaps: GapMarkerReport;
  /**
   * Outcomes of resolving each `@mununu_interface contract://` URI on
   * the interface against the corpus supplied via
   * `ContractDiscoverRequest.corpus`. Empty when no URIs were present
   * or when no corpus was supplied.
   */
  corpus_resolutions?: CorpusResolution[];
}

export interface ContractDiscoverRequest {
  interface: BlackBoxInterface;
  force_controllable?: string[];
  force_uncontrollable?: string[];
  emit_fairness_gap?: boolean;
  /**
   * Filesystem path of the contract corpus root the server should load
   * for resolving `@mununu_interface contract://` URIs. Mirrors the CLI
   * `--corpus <DIR>` flag for three-surface parity.
   */
  corpus?: string;
}

// ============================================================================
// Contract Query Endpoint (Document D §D.2 — corpus lookup)
// ============================================================================

/** Origin of a corpus entry — drives the ranker's trust tier. */
export type CorpusProvenance =
  | { tier: "mununu_verified"; verified_against?: string | null }
  | { tier: "vendor"; name: string; license?: string | null }
  | { tier: "community"; contributors?: string[] };

/** A named alternative within a contract entry. */
export interface ContractAlternative {
  id: string;
  label: string;
  description?: string | null;
}

/** One ranked candidate from a corpus query. */
export interface ContractEntry {
  id: string;
  version: string;
  domain: string;
  name: string;
  description?: string | null;
  parameters?: Record<string, unknown>;
  contract?: unknown;
  alternatives?: ContractAlternative[];
  provenance: CorpusProvenance;
  soundness_flag?: string | null;
}

export interface ContractQueryRequest {
  /** `<domain>/<name>` identifier, e.g. `"rtl_protocol/axi4_slave"`. */
  id: string;
  /** Filesystem path of the corpus root the server should load. */
  corpus: string;
  /** Parameters to match against entries. */
  parameters?: Record<string, unknown>;
}

export interface ContractQueryResponse {
  candidates: ContractEntry[];
}

// ============================================================================
// Contract Review Endpoint (Document A §A7 / Document D §D.8) — HITL stage 4
// ============================================================================

/**
 * Where a proposed clause came from. `SourceComment` carries the
 * canonical tag (e.g. `"guarantee"`) and optional 1-based source line;
 * `Corpus` carries the resolved entry id + optional alternative.
 */
export type ProposalProvenance =
  | { source: "source_comment"; tag: string; source_line?: number | null }
  | {
      source: "corpus";
      entry_id: string;
      alternative?: string | null;
    };

/**
 * One proposed clause surfaced for HITL review. Kinds today:
 * `"assumption" | "guarantee" | "invariant" | "reference"`. `reference`
 * is the special-case used for a `Resolved` corpus entry whose body
 * has not yet been unpacked into concrete clauses.
 */
export interface ProposedClause {
  id: string;
  kind: string;
  owner: string;
  description?: string | null;
  provenance: ProposalProvenance;
  soundness_note?: string | null;
}

export interface ReviewPackage {
  module: string;
  phase1: Phase1Output;
  proposed_clauses: ProposedClause[];
}

export interface ContractReviewRequest {
  interface: BlackBoxInterface;
  force_controllable?: string[];
  force_uncontrollable?: string[];
  emit_fairness_gap?: boolean;
  /** Optional corpus root used to resolve `@mununu_interface` URIs. */
  corpus?: string;
}

/**
 * Build a HITL stage-4 review package — phase-2 discovery output plus
 * the flat list of proposed clauses extracted from annotations and
 * resolved corpus references.
 */
export const reviewContract = async (
  request: ContractReviewRequest,
): Promise<ReviewPackage> => {
  const response = await apiClient.post<ReviewPackage>(
    "/contract/review",
    request,
  );
  return response.data;
};

/**
 * Look up matching entries in the contract corpus (Document D §D.2).
 * Returns the ranked candidate list (full parameter-match first, then
 * provenance trust tier, then version descending).
 */
export const queryCorpus = async (
  request: ContractQueryRequest,
): Promise<ContractQueryResponse> => {
  const response = await apiClient.post<ContractQueryResponse>(
    "/contract/query",
    request,
  );
  return response.data;
};

/**
 * Run phase-1 contract discovery (Document A task A5) on a black-box
 * interface description. Returns labels with controllability + gap
 * markers.
 */
export const discoverContract = async (
  request: ContractDiscoverRequest,
): Promise<Phase1Output> => {
  const response = await apiClient.post<Phase1Output>(
    "/contract/discover",
    request,
  );
  return response.data;
};

/**
 * Validate a contract set's discharge graph (Document A §3.x).
 *
 * Returns the SCC verdict (acyclic / circular / potentially-circular / unmet).
 * Cheap mechanical check; uses the standard `apiClient` (10s timeout).
 */
export const validateContract = async (
  set: ContractSet,
): Promise<DischargeVerdict> => {
  const response = await apiClient.post<DischargeVerdict>(
    "/contract/validate",
    set,
  );
  return response.data;
};
