/**
 * CegarTraceView — presentational rendering of a CEGAR refinement trace.
 *
 * Extracted from the former standalone `/cegar` panel so the trace
 * rendering is reused (not duplicated) between the CEGAR runner and the
 * extraction tab's BTOR2 → CEGAR step. Pure view: takes a
 * `Btor2CegarResponse` and renders the per-iteration table, the 3-valued
 * { T, F, ⊥ } verdict, the termination reason, the final predicate set,
 * any warnings, and (when present) the model CTXDSL with a download.
 */

import { Button } from "../common/Button";
import {
  downloadAsFile,
  Btor2CegarResponse,
  CegarVerdictSummary,
} from "../../api/endpoints";

/** 3-valued verdict cell counts (KleeneT / KleeneF / KleeneBot). */
export const Trit = ({ summary }: { summary: CegarVerdictSummary }) => (
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

export const CegarTraceView = ({ result }: { result: Btor2CegarResponse }) => (
  <section style={{ marginTop: "1.5rem" }}>
    <h3>Refinement trace</h3>
    <div style={{ marginBottom: "1rem" }}>
      <strong>Terminated with:</strong> <code>{result.terminated_with}</code>
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
          <tr key={iter.iteration} style={{ borderBottom: "1px solid #eee" }}>
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
      <strong>Final predicate set ({result.final_predicates.length}):</strong>
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
              downloadAsFile(result.ctxdsl as string, "cegar_model.ctxdsl")
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
);
