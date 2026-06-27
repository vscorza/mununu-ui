/**
 * SvVerifyAutoRunner — no-sidecar SVA verification in the extraction tab (XL.6b).
 *
 * Reads the loaded SystemVerilog from the extraction store and posts to
 * `POST /api/v1/sv/verify-auto`: the backend extracts the design's SVA, lifts SV
 * → BTOR2 (sv2v + Yosys), synthesises `$past` shadow flops, and for each
 * translated property auto-seeds cube predicates from the formula's state-cell
 * atoms and runs the predicate-abstraction refinement loop — rendering a
 * per-property verdict (HOLDS / VIOLATED / ⊥ / skipped). Properties whose atoms
 * reference non-state signals (combinational/IO) are reported skipped, never
 * given a misleading verdict. Surface peer of the CLI `mununu sv verify-auto`.
 */

import { useState } from "react";
import { Button } from "../common/Button";
import {
  runSvVerifyAuto,
  SvVerifyAutoResponse,
  PropertyVerdictView,
} from "../../api/endpoints";
import { useExtractionStore } from "../../store/extractionStore";

const outcomeColor = (outcome: string): string => {
  switch (outcome) {
    case "holds":
      return "var(--success-text, #178a3a)";
    case "violated":
      return "var(--error-text, #c00)";
    case "unknown":
      return "var(--warning-text, #b8860b)";
    default:
      return "var(--text-secondary, #666)"; // skipped
  }
};

const outcomeLabel = (p: PropertyVerdictView): string => {
  const base = p.outcome.toUpperCase();
  if (p.outcome === "unknown") return `⊥ / ${base}`;
  return p.detail && p.outcome !== "skipped" ? `${base} (${p.detail})` : base;
};

export const SvVerifyAutoRunner = () => {
  const { sourceContent, sourceFileName, additionalSources } =
    useExtractionStore();

  const [top, setTop] = useState("");
  const [useSv2v, setUseSv2v] = useState(true);
  const [maxIterations, setMaxIterations] = useState("16");
  const [mustEdgeInference, setMustEdgeInference] = useState("off");
  const [gateReset, setGateReset] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SvVerifyAutoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setResult(null);
    if (!sourceContent.trim()) {
      setError("No SystemVerilog source loaded — complete the Load step first.");
      return;
    }
    const iterations = Number(maxIterations);
    if (!Number.isInteger(iterations) || iterations < 1) {
      setError("Max iterations must be a positive integer.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await runSvVerifyAuto({
        source: sourceContent,
        additional_sources: additionalSources.map((s) => ({
          name: s.name,
          content: s.content,
        })),
        top: top.trim() || undefined,
        use_sv2v: useSv2v,
        max_iterations: iterations,
        must_edge_inference: mustEdgeInference,
        gate_reset: gateReset,
      });
      setResult(response);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unknown error from /api/v1/sv/verify-auto",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p style={{ color: "var(--text-secondary, #666)" }}>
        Verifies the design's SystemVerilog Assertions with no sidecar: the
        backend extracts the SVA, lifts SV → BTOR2 (sv2v + Yosys), and runs
        predicate-abstraction refinement per property, rendering a 3-valued{" "}
        <code>{"{ HOLDS, VIOLATED, ⊥ }"}</code> verdict. Combinational/IO
        properties (over inputs/outputs) are reported skipped. Surface peer of
        the CLI <code>mununu sv verify-auto</code>.
      </p>

      <section style={{ marginTop: "1rem" }}>
        <strong>SystemVerilog source:</strong>{" "}
        {sourceFileName ? (
          <code>{sourceFileName}</code>
        ) : (
          <span style={{ color: "var(--error-text, #c00)" }}>
            none loaded — complete the Load step
          </span>
        )}
        {additionalSources.length > 0 && (
          <span style={{ color: "var(--text-secondary, #666)" }}>
            {" "}
            (+{additionalSources.length} additional source
            {additionalSources.length !== 1 ? "s" : ""})
          </span>
        )}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <label style={{ fontSize: "0.9rem" }}>
            Top module (optional)
            <input
              type="text"
              aria-label="Top module"
              value={top}
              onChange={(e) => setTop(e.target.value)}
              placeholder="(auto-detect)"
              style={{
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.3rem",
                fontFamily: "monospace",
              }}
            />
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
              aria-label="Run sv2v before Yosys"
              checked={useSv2v}
              onChange={(e) => setUseSv2v(e.target.checked)}
            />
            Run sv2v before Yosys (modern SV)
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
              aria-label="Gate reset"
              checked={gateReset}
              onChange={(e) => setGateReset(e.target.checked)}
            />
            Gate reset (drop <code>disable iff</code>, pin reset inactive)
          </label>
        </div>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleVerify}
          isLoading={isLoading}
        >
          Verify all properties
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
          <p>
            <strong>{result.properties.length}</strong> propert
            {result.properties.length === 1 ? "y" : "ies"} verified,{" "}
            <strong>{result.unsupported.length}</strong> unsupported
          </p>
          {result.diagnostics && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #666)" }}>
              model:{" "}
              <strong>{result.diagnostics.state_register_count}</strong> state
              register(s)
              {result.diagnostics.blackboxed_modules.length > 0 && (
                <>
                  {" · "}
                  <span style={{ color: "var(--color-warning, #b8860b)" }}>
                    black-boxed (cut to free inputs — provide source to model):{" "}
                    {result.diagnostics.blackboxed_modules.join(", ")}
                  </span>
                </>
              )}
              {result.diagnostics.gated_resets.length > 0 && (
                <>
                  {" · "}
                  reset-gated (pinned inactive):{" "}
                  {result.diagnostics.gated_resets.join(", ")}
                </>
              )}
            </p>
          )}
          <ul style={{ fontSize: "0.85rem", listStyle: "none", paddingLeft: 0 }}>
            {result.properties.map((p) => (
              <li key={p.name} style={{ marginBottom: "0.5rem" }}>
                <span
                  style={{ fontWeight: 700, color: outcomeColor(p.outcome) }}
                >
                  {outcomeLabel(p)}
                </span>{" "}
                <code>[{p.kind}]</code> <strong>{p.name}</strong>
                <div
                  style={{
                    color: "var(--text-secondary, #666)",
                    marginLeft: "1rem",
                  }}
                >
                  <code>{p.formula}</code>
                  {p.outcome === "skipped" && p.detail && (
                    <div>skipped — {p.detail}</div>
                  )}
                  {p.seeded_predicates.length > 0 && (
                    <div>predicates: {p.seeded_predicates.join(", ")}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {result.unsupported.length > 0 && (
            <div>
              <h4>Unsupported assertions</h4>
              <ul style={{ fontSize: "0.85rem" }}>
                {result.unsupported.map((u) => (
                  <li key={u.name}>
                    <strong>{u.name}</strong>: {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
