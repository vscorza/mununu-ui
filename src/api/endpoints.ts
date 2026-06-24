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
  /**
   * When `format === "sv-yosys"`, opt in to the sv2v preprocessor pass
   * before Yosys elaboration. Required for modern open-source SV
   * dialects (SV2009/2012 module-header `import pkg::*;`) that Yosys's
   * built-in parser does not accept. Mirrors the CLI's
   * `--preprocessor sv2v` flag. Ignored by all other formats.
   */
  use_sv2v?: boolean;
  /**
   * R.6.7 / V.6 (2026-06-09) — predicate set for the
   * controllability-aware predicate-cube lift. Each entry is a
   * {name, register, value} triple identifying a register-value
   * equality predicate. When non-empty AND `controllable_inputs` is
   * non-empty AND `format === "btor2"`, the backend's
   * `predicate_cube_lift` is invoked + the resulting KMTS is
   * returned. Mirrors the CLI's `--predicate NAME:REG=VALUE` flag
   * on `mununu btor2 cegar`.
   *
   * SV-yosys routing (run sv2v + Yosys + lift in one call) is a
   * follow-up; today the user runs `mununu sv emit-btor2-per-module`
   * first to produce BTOR2 from SV, then sends the BTOR2 to this
   * endpoint with the controllability-aware fields.
   */
  predicates?: PredicateSpecRequest[];
  /**
   * R.6.7 / V.6 (2026-06-09) — names of BTOR2 input symbols the
   * controller drives. Mirrors the CLI's `--controllable-input`
   * flag. When non-empty AND `predicates` is non-empty, opts the
   * import path into the R.6.6 controllability-aware lift.
   */
  controllable_inputs?: string[];
}

/**
 * R.6.7 / V.6 (2026-06-09) — predicate-spec request shape mirroring
 * the backend `crate::api::models::PredicateSpecRequest`. The
 * `name` is human-readable (e.g. `"burst_zero"`); the `register` is
 * the BTOR2 symbol name; the `value` is the integer constant the
 * predicate witnesses (`register == value`).
 */
export interface PredicateSpecRequest {
  name: string;
  register: string;
  value: number;
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

// CEGAR refinement-trace types (matches mununu backend /api/v1/btor2/cegar)

/**
 * U.0 (slot 6) — request for the CEGAR refinement endpoint
 * (`POST /api/v1/btor2/cegar`). Mirrors the CLI `mununu btor2 cegar`:
 * runs the predicate-abstraction-refinement loop over a BTOR2 design
 * and returns the per-iteration refinement trace the viewer renders.
 */
export interface Btor2CegarRequest {
  /** BTOR2 source content. */
  content: string;
  /** μ-calculus formula evaluated over the lifted KMTS. */
  formula: string;
  /**
   * Initial predicate set (bootstraps the `2^|P|` cube space). At least
   * one entry is required. Reuses the `{name, register, value}` shape.
   */
  predicates: PredicateSpecRequest[];
  /**
   * Optional R.6.6 controllability split — controller-driven input
   * symbols (mirrors `--controllable-input`).
   */
  controllable_inputs?: string[];
  /** Predicate-discovery source: `"wp"` (default) | `"craig"`. */
  predicate_source?: string;
  /** Max CEGAR iterations (default 16). */
  max_iterations?: number;
  /**
   * Must-edge inference policy (kebab-case; default `"off"`):
   * `"sampling-confluence"` | `"smt-per-target"` |
   * `"smt-per-target-standard"` | `"smt-hyper-must"`.
   */
  must_edge_inference?: string;
  /**
   * May-edge inference policy (kebab-case; default `"off"`):
   * `"smt-all-pairs"` for the sound all-pairs may-relation. Mirrors the
   * CLI `--may-edge-inference`.
   */
  may_edge_inference?: string;
  /**
   * R-S8 symbolic-init config-values, one entry per register as
   * `"REG=v1,v2,..."` (mirrors the CLI `--config-values`). Each register's
   * admissible power-up set seeds the predicate-cube initial states. Needed
   * for init-hazard properties (e.g. the M.4 Caliptra `boot_fsm_ns` CWE-1245).
   */
  config_values?: string[];
  /**
   * CTXDSL Phase 2 — opt-in (default `false`): when `true`, the response
   * carries a `ctxdsl` field with the final refined cube model + the checked
   * formula as a self-contained CTXDSL document. Mirrors the CLI
   * `--emit-ctxdsl`.
   */
  emit_ctxdsl?: boolean;
}

/** Cell counts of a 3-valued (Kleene) verdict over the cube space. */
export interface CegarVerdictSummary {
  /** KleeneT (definitely-true) cells. */
  true_cells: number;
  /** KleeneF (definitely-false) cells. */
  false_cells: number;
  /** KleeneBot (unknown — needs refinement) cells. */
  unknown_cells: number;
}

/** A predicate spec, response-shaped (`register == value`). */
export interface PredicateView {
  name: string;
  register: string;
  value: number;
}

/**
 * Track I.1 — a cube cell witnessing a non-HOLDS verdict: the cube index plus
 * the predicate valuation (`name → holds`) at that cell. Makes a failing or
 * indefinite verdict actionable ("falsified where `idle=false, err=true`").
 */
export interface WitnessCellView {
  cube_index: number;
  valuation: Record<string, boolean>;
}

/** One CEGAR iteration, viewer-shaped. */
export interface CegarIterationView {
  iteration: number;
  /** Predicate-set size at the start of this iteration. */
  predicate_count: number;
  /**
   * `true` iff this iteration's verdict carried `KleeneBot` cells
   * (a failure subgame drove a refinement).
   */
  had_failure_subgame: boolean;
  /** Predicates the source added in response to this iteration. */
  predicates_added: PredicateView[];
  /** Proxy counter for game-position evaluations (reuse diagnostics). */
  game_position_evaluations: number;
  /** Cell-count summary of this iteration's 3-valued verdict. */
  verdict: CegarVerdictSummary;
}

/**
 * U.0 — CEGAR refinement trace. Mirrors the backend
 * `crate::adapter::btor2::cegar::CegarTrace`.
 */
export interface Btor2CegarResponse {
  success: boolean;
  /** Per-iteration refinement records (iteration 0 = initial evaluation). */
  iterations: CegarIterationView[];
  /** Predicate set at termination (initial + every added predicate). */
  final_predicates: PredicateView[];
  /**
   * Why the loop stopped: `"converged"` |
   * `"bounded-iterations-reached"` | `"predicate-source-exhausted"`.
   */
  terminated_with: string;
  /** Cell-count summary of the final 3-valued verdict. */
  verdict: CegarVerdictSummary;
  /** `true` when the eager `predicate_cube_lift` was used (R.2.5 MVP). */
  lazy_lift_pending: boolean;
  /** Whether prior-iteration approximants were threaded forward. */
  approximant_reuse_enabled: boolean;
  /** Soundness / advisory warnings produced during the run. */
  warnings: string[];
  /**
   * Track I.1 — cube cells that falsify the formula (definite-False), each
   * decoded to its predicate valuation. Capped; `verdict.false_cells` is the
   * full total. Empty unless the outcome is VIOLATED. (Optional in the type for
   * back-compat with older mocks; the current backend always populates it.)
   */
  violating_cells?: WitnessCellView[];
  /**
   * Track I.1 — cube cells the abstraction cannot decide (⊥), each decoded to
   * its predicate valuation. Capped; `verdict.unknown_cells` is the full total.
   */
  undecided_cells?: WitnessCellView[];
  /**
   * CTXDSL Phase 2 — the final refined cube model + the checked formula as
   * CTXDSL, present only when the request set `emit_ctxdsl: true`.
   */
  ctxdsl?: string;
}

/**
 * Run the CEGAR predicate-abstraction-refinement loop over a BTOR2
 * design. Z3-heavy — uses the extended (`aiApiClient`, 120s) client.
 */
export const runBtor2Cegar = async (
  request: Btor2CegarRequest,
): Promise<Btor2CegarResponse> => {
  const response = await aiApiClient.post<Btor2CegarResponse>(
    "/btor2/cegar",
    request,
  );
  return response.data;
};

/**
 * cegar-extraction Stage 2 — SV-direct CEGAR request
 * (`POST /api/v1/sv/cegar`). Mirrors the CLI `mununu sv cegar`: the
 * backend lifts SystemVerilog to a flattened BTOR2 (sv2v + Yosys) and
 * runs the same refinement loop as `/btor2/cegar`, returning the same
 * {@link Btor2CegarResponse}. The CEGAR fields match {@link Btor2CegarRequest};
 * only the source half differs (SV + Yosys options instead of raw BTOR2).
 */
export interface SvCegarRequest {
  /** SystemVerilog primary source content. */
  source: string;
  /** Additional SV source files (packages / sub-modules / includes). */
  additional_sources?: { name: string; content: string }[];
  /** Top module name (Yosys auto-detects when omitted). */
  top?: string;
  /** Run sv2v before Yosys (modern SV). */
  use_sv2v?: boolean;
  /** Yosys `setundef -anyseq` (per-cycle havoc). */
  setundef_anyseq?: boolean;
  /** Yosys `setundef -anyconst` (constant power-up nondeterminism). */
  setundef_anyconst?: boolean;
  // --- CEGAR params (identical to Btor2CegarRequest) ---
  formula: string;
  predicates: PredicateSpecRequest[];
  controllable_inputs?: string[];
  predicate_source?: string;
  max_iterations?: number;
  must_edge_inference?: string;
  may_edge_inference?: string;
  config_values?: string[];
  emit_ctxdsl?: boolean;
}

/**
 * Run SV-direct CEGAR in one call: lift SV (sv2v + Yosys) → BTOR2 →
 * refinement loop. sv2v/Yosys/Z3-heavy — uses the extended
 * (`aiApiClient`, 120s) client.
 */
export const runSvCegar = async (
  request: SvCegarRequest,
): Promise<Btor2CegarResponse> => {
  const response = await aiApiClient.post<Btor2CegarResponse>(
    "/sv/cegar",
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
  "crewai.json",
  "crewai",
  "langgraph.json",
  "langgraph",
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
  "crewai",
  "langgraph",
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
export type ControllerExportFormat = "ctxdsl" | "xstate" | "systemverilog";

export const EXPORT_FORMAT_EXTENSIONS: Record<ControllerExportFormat, string> =
  {
    ctxdsl: ".ctxdsl",
    xstate: ".json",
    systemverilog: ".sv",
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

// ============================================================================
// Codesign Verify Endpoint (Document C task C4) — HW/SW codesign
// ============================================================================

/** Direction of a register relative to firmware. */
export type RegisterDirection = "RW" | "RO" | "WO";

/** Standard concurrency-semantics classes (Doc C §C.2). */
export type VisibilityClass =
  | "control"
  | "status"
  | "data"
  | "interrupt_flag"
  | "clear_on_read"
  | "other";

/** How firmware reaches the register (Doc C §C.2). */
export type AccessPath = "mmio_direct" | "mmio_bridge" | "dma";

/** A single bit-field inside a register. */
export interface RegisterField {
  name: string;
  bits: [number, number];
  sv_signal?: string | null;
  c_accessor?: string | null;
  description?: string | null;
}

/** A single memory-mapped register. */
export interface Register {
  name: string;
  offset: number;
  width_bits: number;
  direction: RegisterDirection;
  visibility_class?: VisibilityClass;
  access_path?: AccessPath;
  fields?: RegisterField[];
  description?: string | null;
}

/** Top-level register-map sidecar (Document C task C1 schema). */
export interface RegisterMap {
  peripheral: string;
  base_address: string;
  registers: Register[];
  description?: string | null;
  contract_uri?: string | null;
}

/** Composition shape report from `POST /api/v1/codesign/verify`. */
export interface CodesignCompositionInfo {
  peripheral_automaton: string;
  composition_name: string;
  firmware_members: string[];
  automaton: string;
}

export interface CodesignVerifyRequest {
  /** Parsed register-map sidecar. */
  register_map: RegisterMap;
  /** Firmware CTXDSL document text. */
  firmware_ctxdsl: string;
  /** Formula name to evaluate (declared in `firmware_ctxdsl`). */
  formula: string;
  /** Composition or automaton to evaluate over (default:
   *  `<PERIPHERAL>System`). */
  automaton?: string;
  /** Override the peripheral automaton name. */
  peripheral_automaton?: string;
  /** Override the composition name. */
  composition_name?: string;
}

export interface CodesignVerifyResponse {
  /** Whether every initial state satisfies the formula. */
  satisfied: boolean;
  total_states: number;
  satisfying_states: number;
  initial_states: string[];
  initial_satisfying: string[];
  composition: CodesignCompositionInfo;
  /** The full composed CTXDSL — useful for the UI to render
   *  alongside the verdict. */
  composed_ctxdsl: string;
}

/**
 * HW/SW codesign verification entry point (Document C task C4).
 *
 * Splices the register-map sidecar into a hand-authored firmware
 * CTXDSL, realises the composed context, and evaluates the named
 * formula. Returns the verdict + composition shape + composed CTXDSL.
 */
export const verifyCodesign = async (
  request: CodesignVerifyRequest,
): Promise<CodesignVerifyResponse> => {
  const response = await apiClient.post<CodesignVerifyResponse>(
    "/codesign/verify",
    request,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// Verify framework (general N-source) — POST /api/v1/verify
// ---------------------------------------------------------------------------

/** One `[[sources]]` entry inside a parsed verify.toml. */
export interface VerifySource {
  id: string;
  adapter: string;
  files: string[];
  options?: Record<string, unknown>;
}

/** `[alphabet]` block. Optional fields apply per strategy. */
export interface VerifyAlphabet {
  strategy: "direct" | "renamings" | "register_map";
  renamings?: Array<{ from: string; to: string }>;
  register_map?: string;
  allow_peripheral_superset?: boolean;
}

/** `[composition]` block. */
export interface VerifyComposition {
  semantics: "synchronous" | "asynchronous" | "superset";
  members: string[];
  name?: string;
}

/** One `[[properties]]` entry. */
export interface VerifyProperty {
  name: string;
  template?: string;
  formula?: string;
  args?: Record<string, string>;
  over?: string;
}

/** Parsed verify.toml payload. Mirrors `verify::config::VerifyConfig`. */
export interface VerifyConfig {
  project: { name: string; description?: string };
  sources: VerifySource[];
  alphabet?: VerifyAlphabet;
  composition: VerifyComposition;
  properties?: VerifyProperty[];
}

/**
 * Request body for `POST /api/v1/verify`.
 *
 * Supply exactly one of `config` (pre-parsed) or `config_toml` (raw
 * verify.toml text the backend parses for you). The latter avoids a
 * client-side TOML parser dependency.
 */
export interface VerifyProjectRequest {
  /** Pre-parsed verify.toml payload. Mutually exclusive with `config_toml`. */
  config?: VerifyConfig;
  /** Raw verify.toml text. Mutually exclusive with `config`. */
  config_toml?: string;
  /** Directory the source paths in the config resolve against. */
  base_dir: string;
  /**
   * R4W-3 (R.4 clustered-COI) — Jaccard similarity floor for the
   * clustered cone-of-influence comparison the BTOR2 (`sv-yosys`) route
   * reports per source. Overrides any `cluster_similarity_floor` in the
   * supplied config / config_toml. Omitted → the backend's recommended
   * `0.5`. Tighter (→ 1.0) approaches per-property COI; looser (→ 0.0)
   * collapses toward joint COI.
   */
  cluster_similarity_floor?: number;
}

/**
 * R4W-3 — one cluster's entry in a {@link VerifyClusterCoiReport}.
 * Mirrors `adapter::partition::coi::ClusterCoiEntry`.
 */
export interface VerifyClusterCoiEntry {
  /** Property names merged into this cluster. */
  members: string[];
  /** Signal count in this cluster's cone (its members' cone union). */
  cone_size: number;
}

/**
 * R4W-3 — joint-vs-clustered cone comparison the BTOR2 bit-blaster
 * reports per source. Mirrors `adapter::partition::coi::ClusterCoiReport`.
 * Clustering helps exactly when `max_cluster_cone_size < joint_cone_size`.
 */
export interface VerifyClusterCoiReport {
  /** Signals a naive joint COI over all properties would keep. */
  joint_cone_size: number;
  /** Per-cluster entries (deterministic input order). */
  clusters: VerifyClusterCoiEntry[];
  /** Largest per-cluster cone — bounds independent per-cluster analysis. */
  max_cluster_cone_size: number;
}

/**
 * R4W-3 — per-source partition telemetry. Mirrors
 * `adapter::partition::PartitionSummary`. `cluster_coi` is present only
 * when the source ran the BTOR2 route with declared properties.
 */
export interface VerifyPartitionSummary {
  total_signals: number;
  kept: number;
  dropped_coi: number;
  datapath_uf: number;
  state_bits_before: number | null;
  state_bits_after: number | null;
  cluster_coi?: VerifyClusterCoiReport;
  /**
   * R46-4 (R.4.6) — per-cluster verification routing. Present ONLY when
   * the joint design busted the backend state-bit cap and per-cluster
   * verification kicked in: maps each property name to the cluster
   * automaton (`Circuit__cl0`, …) its verdict was evaluated over. Absent
   * on the joint path. Mirrors `PartitionSummary::cluster_routing`.
   */
  cluster_routing?: Record<string, string>;
}

/** Per-source diagnostic in the verify report. */
export interface VerifySourceSummary {
  id: string;
  adapter: string;
  automaton: string | null;
  /** R4W-3 — partition / clustered-COI telemetry (BTOR2 route). */
  partition_summary?: VerifyPartitionSummary;
}

/** Composition shape used for evaluation. */
export interface VerifyCompositionInfo {
  semantics: string;
  name: string;
  members: string[];
}

/** How a property's formula was sourced. */
export type VerifyPropertyFormulaSource =
  | { kind: "inline" }
  | { kind: "template"; id: string; args: Record<string, string> };

/** One step inside a `VerifyTraceWitness`. */
export interface VerifyTraceStep {
  /** Label payload of the fired transition (comma-joined when multi-label). */
  label: string;
  /** Composed-state name entered after firing this transition. */
  successor_state: string;
}

/** Reason a `VerifyTraceWitness` stopped at a particular step. */
export type VerifyTraceTermination =
  | { kind: "sink" }
  | { kind: "cycle"; return_to_step: number }
  | { kind: "length_limit" };

/**
 * Forward-walk witness from a violating initial state, attached to a
 * `VerifyPropertyVerdict` when the verdict is unsatisfied. Mirrors
 * `mununu_core::verify::report::TraceWitness`.
 */
export interface VerifyTraceWitness {
  initial_state: string;
  steps: VerifyTraceStep[];
  termination: VerifyTraceTermination;
}

/** Per-property verdict. */
export interface VerifyPropertyVerdict {
  name: string;
  formula_source: VerifyPropertyFormulaSource;
  formula: string;
  over: string;
  satisfied: boolean;
  total_states: number;
  satisfying_states: number;
  initial_states: string[];
  initial_satisfying: string[];
  /**
   * IR-track P3.1 — 3-valued { T, F, ⊥ } summary over the initial states.
   * Same shape as the cegar `CegarVerdictSummary` (reuses the `Trit`
   * renderer). On the bit-blast verify path `unknown_cells` is 0 and this
   * mirrors `satisfied`; the predicate-cube path (P3.3) populates ⊥.
   * Optional for back-compat with pre-P3 reports.
   */
  initial_verdict_summary?: {
    true_cells: number;
    false_cells: number;
    unknown_cells: number;
  };
  /** Present only when `satisfied === false` and a witness was constructible. */
  counterexample?: VerifyTraceWitness;
}

/** Top-level report from `POST /api/v1/verify`. */
export interface VerifyReport {
  project: string;
  sources: VerifySourceSummary[];
  composition: VerifyCompositionInfo;
  property_verdicts: VerifyPropertyVerdict[];
}

/**
 * General N-source verification entry point. Mirrors `mununu verify` (CLI).
 *
 * Dispatches each source through its adapter, applies the alphabet
 * binding, assembles a unified CTXDSL document, and evaluates every
 * declared property. Returns the structured `VerifyReport`. Uses the
 * 120-second client because the orchestrator can run multiple
 * adapters + LLVM extraction + property evaluation in a single call.
 */
export const verifyProject = async (
  request: VerifyProjectRequest,
): Promise<VerifyReport> => {
  const response = await aiApiClient.post<VerifyReport>("/verify", request);
  return response.data;
};

// ---------------------------------------------------------------------------
// Memory-check (B2b) — POST /api/v1/verify/memory-check
// ---------------------------------------------------------------------------

/** Per-source posture summary from the memory-check report. */
export interface MemoryPostureSummary {
  source_id: string;
  kind: string;
  tracked: string[];
  value_symbol_set: string[];
  fence_semantics?: string | null;
  notes?: string | null;
}

/**
 * Memory-check warning. The `kind` discriminator matches the
 * server's `serde(rename_all = "snake_case")` tag.
 */
export type MemoryCheckWarning =
  | {
      kind: "chaotic_posture_referenced";
      property_name: string;
      source_id: string;
      reference: string;
    }
  | {
      kind: "value_mention_on_tracked_addresses_posture";
      property_name: string;
      source_id: string;
      reference: string;
    }
  | {
      kind: "untracked_address_referenced";
      property_name: string;
      source_id: string;
      address: string;
    }
  | {
      kind: "undeclared_value_symbol_referenced";
      property_name: string;
      source_id: string;
      address: string;
      symbol: string;
    };

/** Memory-check informational note (currently: RVWMO aspirational). */
export type MemoryCheckInfo = {
  kind: "rvwmo_aspirational";
  source_id: string;
};

/** Top-level report from `POST /api/v1/verify/memory-check`. */
export interface MemoryCheckReport {
  postures: MemoryPostureSummary[];
  undeclared_sources: string[];
  warnings: MemoryCheckWarning[];
  info: MemoryCheckInfo[];
}

/** Request body for `POST /api/v1/verify/memory-check`. */
export interface MemoryCheckRequest {
  /** Pre-parsed verify.toml payload. Mutually exclusive with `config_toml`. */
  config?: VerifyConfig;
  /** Raw verify.toml text. Mutually exclusive with `config`. */
  config_toml?: string;
}

/**
 * Run the memory-soundness analysis on a parsed verify.toml.
 * Mirrors `mununu memory check` (CLI). Pure inspection — no source
 * files read — so the 10-second client is appropriate.
 */
export const verifyMemoryCheck = async (
  request: MemoryCheckRequest,
): Promise<MemoryCheckReport> => {
  const response = await apiClient.post<MemoryCheckReport>(
    "/verify/memory-check",
    request,
  );
  return response.data;
};
