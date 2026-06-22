/**
 * U.0 (slot 6, 2026-06-16) — CEGAR refinement-trace viewer.
 *
 * Surface-parity peer of the CLI's `mununu btor2 cegar` invocation and
 * the API's `POST /api/v1/btor2/cegar` endpoint (shipped at PR #78).
 * This panel is the UI half of U.0 part (4) — "refinement-trace viewer
 * (which predicates / UFs were added at each CEGAR iteration)" — and the
 * companion to the V.6 controllability-aware lift panel.
 *
 * The workflow:
 *   1. User pastes (or uploads) BTOR2 source.
 *   2. User enters the μ-calculus formula to evaluate over the lifted
 *      KMTS.
 *   3. User enters the initial predicate set (one per row: name,
 *      register, value) — these bootstrap the `2^|P|` cube space.
 *   4. (optional) controllable-input names + a predicate-discovery
 *      source (`wp` / `craig`) + an iteration cap + a must-edge
 *      inference policy.
 *   5. "Run CEGAR" sends to the endpoint. The backend runs
 *      `cegar_refine_loop` and returns the per-iteration trace.
 *   6. The panel renders the iterations table (predicate count, whether
 *      a failure subgame drove a refinement, predicates added, the
 *      3-valued T/F/⊥ verdict cells), the final verdict, the termination
 *      reason, the final predicate set, and any warnings.
 *
 * SV-direct input (UI runs sv2v + Yosys + lift + CEGAR in one call) is a
 * follow-up. Today the user runs `mununu sv emit-btor2-per-module`
 * first to produce BTOR2 from SV, then pastes/uploads the BTOR2 here.
 */

import { useState } from "react";
import { Button } from "../common/Button";
import {
  runBtor2Cegar,
  downloadAsFile,
  PredicateSpecRequest,
  Btor2CegarResponse,
  CegarVerdictSummary,
} from "../../api/endpoints";

// A small but valid BTOR2 template: a 1-bit register `r` initialised to
// 0 whose next value is a free input. Always has a successor, so
// `nu X. <true> X` evaluates true. The user edits this for their design.
const EXAMPLE_BTOR2 = `1 sort bitvec 1
2 zero 1
3 state 1 r
4 input 1 in
5 next 1 3 4
6 init 1 3 2
`;

const Trit = ({ summary }: { summary: CegarVerdictSummary }) => (
  <span style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
    <span style={{ color: "var(--success-text, #0a0)" }} title="KleeneT cells">
      T {summary.true_cells}
    </span>
    {" / "}
    <span style={{ color: "var(--error-text, #c00)" }} title="KleeneF cells">
      F {summary.false_cells}
    </span>
    {" / "}
    <span
      style={{ color: "var(--text-secondary, #888)" }}
      title="KleeneBot cells — unknown, needs refinement"
    >
      ⊥ {summary.unknown_cells}
    </span>
  </span>
);

export const RefinementTracePanel = () => {
  const [btor2Content, setBtor2Content] = useState(EXAMPLE_BTOR2);
  const [formula, setFormula] = useState("nu X. <true> X");
  const [predicatesText, setPredicatesText] = useState("r_zero, r, 0\n");
  const [controllableInputsText, setControllableInputsText] = useState("");
  const [predicateSource, setPredicateSource] = useState("wp");
  const [maxIterations, setMaxIterations] = useState("16");
  const [mustEdgeInference, setMustEdgeInference] = useState("off");
  const [mayEdgeInference, setMayEdgeInference] = useState("off");
  const [configValuesText, setConfigValuesText] = useState("");
  const [emitCtxdsl, setEmitCtxdsl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Btor2CegarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsePredicates = (text: string): PredicateSpecRequest[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"))
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        if (parts.length !== 3) {
          throw new Error(
            `Invalid predicate row: ${line}. Expected "name, register, value".`,
          );
        }
        const value = Number(parts[2]);
        if (!Number.isFinite(value)) {
          throw new Error(
            `Invalid predicate value: ${parts[2]} (must be a finite integer).`,
          );
        }
        return { name: parts[0], register: parts[1], value };
      });
  };

  const parseLines = (text: string): string[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"));
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    setBtor2Content(text);
  };

  const handleRunCegar = async () => {
    setError(null);
    setResult(null);
    if (!btor2Content.trim()) {
      setError("BTOR2 source is empty.");
      return;
    }
    if (!formula.trim()) {
      setError("Formula is empty.");
      return;
    }
    let predicates: PredicateSpecRequest[];
    let controllableInputs: string[];
    let configValues: string[];
    try {
      predicates = parsePredicates(predicatesText);
      controllableInputs = parseLines(controllableInputsText);
      configValues = parseLines(configValuesText);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    if (predicates.length === 0) {
      setError("At least one predicate required.");
      return;
    }
    const iterations = Number(maxIterations);
    if (!Number.isInteger(iterations) || iterations < 1) {
      setError("Max iterations must be a positive integer.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await runBtor2Cegar({
        content: btor2Content,
        formula,
        predicates,
        controllable_inputs: controllableInputs,
        predicate_source: predicateSource,
        max_iterations: iterations,
        must_edge_inference: mustEdgeInference,
        may_edge_inference: mayEdgeInference,
        config_values: configValues,
        emit_ctxdsl: emitCtxdsl,
      });
      setResult(response);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unknown error from /api/v1/btor2/cegar",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>CEGAR refinement-trace viewer</h2>
      <p style={{ color: "var(--text-secondary, #666)" }}>
        Runs the predicate-abstraction-refinement loop (R.5) over a BTOR2 design
        and renders the per-iteration trace: which predicates were added,
        whether a failure subgame drove the refinement, and how the 3-valued{" "}
        <code>{"{ T, F, ⊥ }"}</code> verdict converges. Surface peer of the CLI{" "}
        <code>mununu btor2 cegar</code> and the{" "}
        <code>POST /api/v1/btor2/cegar</code> endpoint.
      </p>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>1. BTOR2 source</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #666)" }}>
          Paste BTOR2 text or upload a .btor2 file. For SV input, run{" "}
          <code>mununu sv emit-btor2-per-module</code> first to produce the
          BTOR2.
        </p>
        <input
          type="file"
          accept=".btor2,.btor"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          style={{ marginBottom: "0.5rem" }}
        />
        <textarea
          aria-label="BTOR2 source"
          value={btor2Content}
          onChange={(e) => setBtor2Content(e.target.value)}
          placeholder="; BTOR2 source..."
          style={{
            width: "100%",
            height: "160px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>2. Formula</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #666)" }}>
          The μ-calculus formula evaluated over the lifted KMTS. Example:{" "}
          <code>nu X. {"<true>"} X</code> (a successor always exists).
        </p>
        <input
          type="text"
          aria-label="Formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            padding: "0.4rem",
          }}
        />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>3. Initial predicates</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #666)" }}>
          One per line, comma-separated: <code>name, register, value</code>.
          These bootstrap the <code>2^|P|</code> predicate-cube space. Example:{" "}
          <code>r_zero, r, 0</code>.
        </p>
        <textarea
          aria-label="Initial predicates"
          value={predicatesText}
          onChange={(e) => setPredicatesText(e.target.value)}
          style={{
            width: "100%",
            height: "90px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>4. Options</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <label style={{ fontSize: "0.9rem" }}>
            Predicate source
            <select
              aria-label="Predicate source"
              value={predicateSource}
              onChange={(e) => setPredicateSource(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem", padding: "0.3rem" }}
            >
              <option value="wp">wp (weakest precondition)</option>
              <option value="craig">craig (interpolation, needs cvc5)</option>
            </select>
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            Max iterations
            <input
              type="number"
              aria-label="Max iterations"
              min={1}
              value={maxIterations}
              onChange={(e) => setMaxIterations(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem", padding: "0.3rem" }}
            />
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            Must-edge inference
            <select
              aria-label="Must-edge inference"
              value={mustEdgeInference}
              onChange={(e) => setMustEdgeInference(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem", padding: "0.3rem" }}
            >
              <option value="off">off</option>
              <option value="sampling-confluence">sampling-confluence</option>
              <option value="smt-per-target">smt-per-target (∀∀)</option>
              <option value="smt-per-target-standard">
                smt-per-target-standard (∀∃)
              </option>
              <option value="smt-hyper-must">smt-hyper-must</option>
            </select>
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            May-edge inference
            <select
              aria-label="May-edge inference"
              value={mayEdgeInference}
              onChange={(e) => setMayEdgeInference(e.target.value)}
              style={{ width: "100%", marginTop: "0.25rem", padding: "0.3rem" }}
            >
              <option value="off">off</option>
              <option value="smt-all-pairs">smt-all-pairs (sound)</option>
            </select>
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            Controllable inputs (one per line, optional)
            <textarea
              aria-label="Controllable inputs"
              value={controllableInputsText}
              onChange={(e) => setControllableInputsText(e.target.value)}
              placeholder="ctrl_g0"
              style={{
                width: "100%",
                height: "60px",
                marginTop: "0.25rem",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            />
          </label>
          <label style={{ fontSize: "0.9rem" }}>
            Config values (R-S8 symbolic init; one per line:{" "}
            <code>REG=v1,v2,...</code>)
            <textarea
              aria-label="Config values"
              value={configValuesText}
              onChange={(e) => setConfigValuesText(e.target.value)}
              placeholder="boot_fsm_ns=0,1,2,3,4,5,6,7"
              style={{
                width: "100%",
                height: "60px",
                marginTop: "0.25rem",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            />
          </label>
          <label
            style={{
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              aria-label="Emit CTXDSL of the refined model"
              checked={emitCtxdsl}
              onChange={(e) => setEmitCtxdsl(e.target.checked)}
            />
            Emit CTXDSL of the refined model (context + formula)
          </label>
        </div>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleRunCegar}
          isLoading={isLoading}
        >
          Run CEGAR refinement
        </Button>
      </section>

      {error && (
        <section
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "var(--error-bg, #fee)",
            color: "var(--error-text, #c00)",
            border: "1px solid var(--error-border, #f00)",
            borderRadius: "4px",
          }}
        >
          <strong>Error:</strong> {error}
        </section>
      )}

      {result && (
        <section style={{ marginTop: "1.5rem" }}>
          <h3>Refinement trace</h3>
          <div style={{ marginBottom: "1rem" }}>
            <strong>Terminated with:</strong>{" "}
            <code>{result.terminated_with}</code>
            <br />
            <strong>Final verdict:</strong> <Trit summary={result.verdict} />
            <br />
            <strong>Iterations:</strong> {result.iterations.length}
            {result.lazy_lift_pending && (
              <>
                <br />
                <span style={{ color: "var(--text-secondary, #666)" }}>
                  (eager predicate-cube lift — R.2.5 MVP)
                </span>
              </>
            )}
            {result.approximant_reuse_enabled && (
              <>
                <br />
                <span style={{ color: "var(--text-secondary, #666)" }}>
                  (approximant reuse enabled)
                </span>
              </>
            )}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "0.4rem" }}>Iter</th>
                <th style={{ padding: "0.4rem" }}>Predicates</th>
                <th style={{ padding: "0.4rem" }}>Failure subgame</th>
                <th style={{ padding: "0.4rem" }}>Added</th>
                <th style={{ padding: "0.4rem" }}>Game evals</th>
                <th style={{ padding: "0.4rem" }}>Verdict (T / F / ⊥)</th>
              </tr>
            </thead>
            <tbody>
              {result.iterations.map((iter) => (
                <tr
                  key={iter.iteration}
                  style={{ borderBottom: "1px solid #eee" }}
                >
                  <td style={{ padding: "0.4rem" }}>{iter.iteration}</td>
                  <td style={{ padding: "0.4rem" }}>{iter.predicate_count}</td>
                  <td style={{ padding: "0.4rem" }}>
                    {iter.had_failure_subgame ? "⊥ yes" : "—"}
                  </td>
                  <td style={{ padding: "0.4rem", fontFamily: "monospace" }}>
                    {iter.predicates_added.length === 0
                      ? "—"
                      : iter.predicates_added
                          .map((p) => `${p.register}==${p.value}`)
                          .join(", ")}
                  </td>
                  <td style={{ padding: "0.4rem" }}>
                    {iter.game_position_evaluations}
                  </td>
                  <td style={{ padding: "0.4rem" }}>
                    <Trit summary={iter.verdict} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "1rem" }}>
            <strong>
              Final predicate set ({result.final_predicates.length}):
            </strong>
            <ul
              style={{
                fontSize: "0.85rem",
                fontFamily: "monospace",
                background: "var(--code-bg, #f5f5f5)",
                padding: "0.5rem 0.5rem 0.5rem 1.5rem",
                borderRadius: "4px",
              }}
            >
              {result.final_predicates.map((p, i) => (
                <li key={i}>
                  {p.name}: {p.register} == {p.value}
                </li>
              ))}
            </ul>
          </div>

          {result.warnings.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <strong>Warnings ({result.warnings.length}):</strong>
              <ul
                style={{
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  background: "var(--code-bg, #f5f5f5)",
                  padding: "0.5rem 0.5rem 0.5rem 1.5rem",
                  borderRadius: "4px",
                }}
              >
                {result.warnings.map((w, i) => (
                  <li key={i} style={{ marginBottom: "0.25rem" }}>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.ctxdsl && (
            <div style={{ marginTop: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.25rem",
                }}
              >
                <strong>Model CTXDSL (context + formula)</strong>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    downloadAsFile(
                      result.ctxdsl as string,
                      "cegar_model.ctxdsl",
                    )
                  }
                >
                  Download .ctxdsl
                </Button>
              </div>
              <pre
                aria-label="Model CTXDSL"
                style={{
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                  background: "var(--code-bg, #f5f5f5)",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  maxHeight: "320px",
                  overflow: "auto",
                  whiteSpace: "pre",
                }}
              >
                {result.ctxdsl}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
