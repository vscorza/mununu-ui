/**
 * Minimal panel for validating an assume/guarantee contract set against
 * the mununu backend's discharge check (Document A §3.x).
 *
 * The user pastes a JSON `ContractSet`, clicks Validate, and sees the
 * verdict (acyclic / circular / potentially-circular / unmet). Cycles
 * are displayed as ordered lists so the user can see exactly which
 * clauses participate.
 *
 * This is the first user-visible surface for the new `contract` machinery
 * shipped in tasks A1 + A2 of `docs/design/black-box-modules.md`.
 */

import { useState } from "react";
import {
  validateContract,
  discoverContract,
  queryCorpus,
  reviewContract,
  type ContractSet,
  type DischargeVerdict,
  type BlackBoxInterface,
  type Phase1Output,
  type CorpusResolution,
  type ContractEntry,
  type ContractQueryResponse,
  type ReviewPackage,
  type ProposedClause,
  type ProposalProvenance,
} from "../../api/endpoints";

const EXAMPLE_ACYCLIC: ContractSet = {
  clauses: [
    { id: "G_master", kind: "guarantee", owner: "master" },
    { id: "A_arbiter", kind: "assumption", owner: "arbiter" },
    { id: "G_arbiter", kind: "guarantee", owner: "arbiter" },
    { id: "A_slave", kind: "assumption", owner: "slave" },
  ],
  discharges: [
    { discharger: "G_master", dischargee: "A_arbiter" },
    { discharger: "G_arbiter", dischargee: "A_slave" },
  ],
  environment_assumptions: [],
};

const EXAMPLE_CIRCULAR: ContractSet = {
  clauses: [
    { id: "G_a", kind: "guarantee", owner: "a" },
    { id: "A_a", kind: "assumption", owner: "a" },
    { id: "G_b", kind: "guarantee", owner: "b" },
    { id: "A_b", kind: "assumption", owner: "b" },
  ],
  discharges: [
    { discharger: "G_a", dischargee: "A_b" },
    { discharger: "A_b", dischargee: "G_b" },
    { discharger: "G_b", dischargee: "A_a" },
    { discharger: "A_a", dischargee: "G_a" },
  ],
  environment_assumptions: [],
};

const EXAMPLE_RANK_WITNESS: ContractSet = {
  clauses: [
    { id: "G_a", kind: "guarantee", owner: "a", mu_rank: 4 },
    { id: "A_b", kind: "assumption", owner: "b", mu_rank: 3 },
    { id: "G_b", kind: "guarantee", owner: "b", mu_rank: 2 },
    { id: "A_a", kind: "assumption", owner: "a", mu_rank: 1 },
  ],
  discharges: [
    { discharger: "G_a", dischargee: "A_b" },
    { discharger: "A_b", dischargee: "G_b" },
    { discharger: "G_b", dischargee: "A_a" },
    { discharger: "A_a", dischargee: "G_a" },
  ],
  environment_assumptions: [],
};

const EXAMPLE_INTERFACE: BlackBoxInterface = {
  name: "DDR_CTRL_V1",
  ports: [
    { name: "aclk", direction: "Input", description: "clock" },
    { name: "aresetn", direction: "Input", description: "active-low reset" },
    { name: "awvalid", direction: "Input" },
    { name: "awready", direction: "Output" },
    { name: "bresp", direction: "Output", description: "AXI write response" },
  ],
  source_file: "rtl/ddr_wrapper.sv",
  source_line: 12,
};

const EXAMPLE_INTERFACE_WITH_ANNOTATIONS: BlackBoxInterface = {
  name: "AES_CTR_v1",
  ports: [
    { name: "clk", direction: "Input", description: "clock" },
    { name: "start", direction: "Input" },
    { name: "done", direction: "Output" },
    { name: "cipher_out", direction: "Output" },
  ],
  source_file: "rtl/vendor/aes_ctr_v1.sv",
  source_line: 8,
  annotations: [
    { tag: "blackbox", value: "" },
    {
      tag: "interface",
      value: "contract://rtl_crypto/aes_ctr@1.0.0?alt=strict_iv",
    },
    { tag: "guarantee", value: "G(start -> eventually done)" },
  ],
};

type SubTab = "validate" | "discover" | "query" | "review";

export const ContractPanel = () => {
  const [subTab, setSubTab] = useState<SubTab>("validate");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px 16px 0",
          borderBottom: "1px solid #ddd",
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab("validate")}
          style={{
            padding: "6px 14px",
            background: subTab === "validate" ? "#fff" : "transparent",
            border: "1px solid #ccc",
            borderBottom: subTab === "validate" ? "1px solid #fff" : "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: subTab === "validate" ? 600 : 400,
          }}
        >
          Validate
        </button>
        <button
          type="button"
          onClick={() => setSubTab("discover")}
          style={{
            padding: "6px 14px",
            background: subTab === "discover" ? "#fff" : "transparent",
            border: "1px solid #ccc",
            borderBottom: subTab === "discover" ? "1px solid #fff" : "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: subTab === "discover" ? 600 : 400,
          }}
        >
          Discover
        </button>
        <button
          type="button"
          onClick={() => setSubTab("query")}
          style={{
            padding: "6px 14px",
            background: subTab === "query" ? "#fff" : "transparent",
            border: "1px solid #ccc",
            borderBottom: subTab === "query" ? "1px solid #fff" : "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: subTab === "query" ? 600 : 400,
          }}
        >
          Corpus
        </button>
        <button
          type="button"
          onClick={() => setSubTab("review")}
          style={{
            padding: "6px 14px",
            background: subTab === "review" ? "#fff" : "transparent",
            border: "1px solid #ccc",
            borderBottom: subTab === "review" ? "1px solid #fff" : "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: subTab === "review" ? 600 : 400,
          }}
        >
          Review
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {subTab === "validate" && <ValidateSubPanel />}
        {subTab === "discover" && <DiscoverSubPanel />}
        {subTab === "query" && <QuerySubPanel />}
        {subTab === "review" && <ReviewSubPanel />}
      </div>
    </div>
  );
};

const ValidateSubPanel = () => {
  const [text, setText] = useState<string>(
    JSON.stringify(EXAMPLE_ACYCLIC, null, 2),
  );
  const [verdict, setVerdict] = useState<DischargeVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onValidate = async () => {
    setError(null);
    setVerdict(null);
    setPending(true);
    try {
      const parsed = JSON.parse(text) as ContractSet;
      const result = await validateContract(parsed);
      setVerdict(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        height: "100%",
        overflow: "auto",
      }}
    >
      <div>
        <h3 style={{ margin: 0, marginBottom: "4px" }}>
          Contract discharge validator
        </h3>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>
          Paste an assume/guarantee contract set as JSON. The mununu backend
          runs Tarjan SCC over the guarantor→consumer graph and reports whether
          the discharge is acyclic, circular, potentially circular (unresolved
          clauses), or unmet (some assumption has no discharger).
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setText(JSON.stringify(EXAMPLE_ACYCLIC, null, 2))}
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load acyclic example
        </button>
        <button
          type="button"
          onClick={() => setText(JSON.stringify(EXAMPLE_CIRCULAR, null, 2))}
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load circular example
        </button>
        <button
          type="button"
          onClick={() => setText(JSON.stringify(EXAMPLE_RANK_WITNESS, null, 2))}
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load rank-witness example
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "220px",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "12px",
          padding: "8px",
          resize: "vertical",
        }}
      />

      <div>
        <button
          type="button"
          onClick={onValidate}
          disabled={pending}
          style={{
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {pending ? "Validating…" : "Validate discharge"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#fde2e2",
            color: "#8a1f1f",
            borderRadius: "4px",
            fontSize: "13px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {verdict && <VerdictView verdict={verdict} />}
    </div>
  );
};

const VerdictView = ({ verdict }: { verdict: DischargeVerdict }) => {
  const colour = verdictColour(verdict);
  return (
    <div
      style={{
        padding: "12px",
        background: colour.bg,
        color: colour.fg,
        borderLeft: `4px solid ${colour.border}`,
        borderRadius: "2px",
        fontSize: "13px",
        whiteSpace: "pre-wrap",
      }}
    >
      <strong style={{ fontSize: "14px" }}>{verdictHeadline(verdict)}</strong>
      <div style={{ marginTop: "8px" }}>{renderVerdictBody(verdict)}</div>
    </div>
  );
};

const verdictHeadline = (verdict: DischargeVerdict): string => {
  switch (verdict.kind) {
    case "acyclic":
      return "discharge: acyclic — Pnueli 1985 rule applies";
    case "circular_with_rank_witness":
      return "discharge: circular with mu-rank witness — auto-accepted (McMillan-style)";
    case "circular":
      return "discharge: circular reasoning required";
    case "potentially_circular":
      return "discharge: potentially circular (unresolved clauses)";
    case "unmet":
      return "discharge: unmet obligations";
  }
};

const verdictColour = (
  verdict: DischargeVerdict,
): { bg: string; fg: string; border: string } => {
  switch (verdict.kind) {
    case "acyclic":
      return { bg: "#e3f6e8", fg: "#1f6b3a", border: "#1f6b3a" };
    case "circular_with_rank_witness":
      return { bg: "#e3f6e8", fg: "#1f6b3a", border: "#2f9551" };
    case "circular":
      return { bg: "#fdecd0", fg: "#7a4e07", border: "#c0791d" };
    case "potentially_circular":
      return { bg: "#e6e6fa", fg: "#4a3f8a", border: "#4a3f8a" };
    case "unmet":
      return { bg: "#fde2e2", fg: "#8a1f1f", border: "#a53030" };
  }
};

const renderVerdictBody = (verdict: DischargeVerdict): React.ReactNode => {
  switch (verdict.kind) {
    case "acyclic":
      return (
        <>
          {verdict.topological.length > 0 && (
            <div>
              <em>topological order:</em>
              <ol style={{ margin: "4px 0 0 20px" }}>
                {verdict.topological.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ol>
            </div>
          )}
          {verdict.unmet_environment.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <em>environment-declared assumptions:</em>
              <ul style={{ margin: "4px 0 0 20px" }}>
                {verdict.unmet_environment.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      );
    case "circular_with_rank_witness":
      return (
        <>
          <div>
            <em>cycles (each discharged by a mu-rank witness):</em>
            {verdict.cycles.map((witness, idx) => (
              <div
                key={idx}
                style={{
                  margin: "8px 0",
                  paddingLeft: "16px",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "12px",
                }}
              >
                [{witness.cycle.join(" → ")}]
                <div style={{ opacity: 0.85 }}>
                  base edge: {witness.base_edge[0]} → {witness.base_edge[1]}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: "8px", fontSize: "12px", opacity: 0.85 }}>
            Mununu auto-accepts these via the lightweight McMillan check
            (Document A task A8): every cycle has a strict mu-rank descent
            except at the marked base edge, witnessing well- founded induction.
          </p>
          {verdict.acyclic_remainder.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <em>acyclic remainder (singletons):</em>
              <ul style={{ margin: "4px 0 0 20px" }}>
                {verdict.acyclic_remainder.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      );
    case "circular":
      return (
        <>
          <div>
            <em>cycles:</em>
            {verdict.cycles.map((cycle, idx) => (
              <div
                key={idx}
                style={{
                  margin: "4px 0",
                  paddingLeft: "16px",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                [{cycle.join(" → ")}]
              </div>
            ))}
          </div>
          <p style={{ marginTop: "8px", fontSize: "12px", opacity: 0.85 }}>
            Mununu refuses to silently accept circular discharge. HITL must
            approve, or one cycle clause must be rewritten to be unconditional.
            Tip: assign <code>mu_rank</code> to each clause to enable the
            lightweight McMillan auto-discharge (A8).
          </p>
          {verdict.acyclic_remainder.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <em>acyclic remainder (singletons):</em>
              <ul style={{ margin: "4px 0 0 20px" }}>
                {verdict.acyclic_remainder.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      );
    case "potentially_circular":
      return (
        <>
          <div>
            <em>unresolved ids:</em>
            <ul style={{ margin: "4px 0 0 20px" }}>
              {verdict.unresolved.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: "8px" }}>
            <em>partial verdict:</em> {verdict.partial.kind}
          </div>
        </>
      );
    case "unmet":
      return (
        <>
          <div>
            <em>assumptions without any guarantor or env declaration:</em>
            <ul style={{ margin: "4px 0 0 20px" }}>
              {verdict.missing_dischargers.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: "8px" }}>
            <em>partial verdict:</em> {verdict.partial.kind}
          </div>
        </>
      );
  }
};

const DiscoverSubPanel = () => {
  const [text, setText] = useState<string>(
    JSON.stringify(EXAMPLE_INTERFACE, null, 2),
  );
  const [emitFairness, setEmitFairness] = useState(false);
  const [corpusPath, setCorpusPath] = useState<string>("");
  const [output, setOutput] = useState<Phase1Output | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onDiscover = async () => {
    setError(null);
    setOutput(null);
    setPending(true);
    try {
      const iface = JSON.parse(text) as BlackBoxInterface;
      const trimmed = corpusPath.trim();
      const result = await discoverContract({
        interface: iface,
        emit_fairness_gap: emitFairness,
        ...(trimmed ? { corpus: trimmed } : {}),
      });
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        height: "100%",
        overflow: "auto",
      }}
    >
      <div>
        <h3 style={{ margin: 0, marginBottom: "4px" }}>
          Black-box interface discovery (phase 1 + 2)
        </h3>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>
          Paste a black-box interface description as JSON (module name + port
          list + optional <code>annotations[]</code>). The backend classifies
          each label via the shared controllability rule, emits gap markers, and
          — when a corpus path is supplied — resolves any{" "}
          <code>@mununu_interface contract://</code> annotation against the
          corpus (Document A §A5/A6, Document D §D.5).
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setText(JSON.stringify(EXAMPLE_INTERFACE, null, 2))}
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load plain interface
        </button>
        <button
          type="button"
          onClick={() =>
            setText(JSON.stringify(EXAMPLE_INTERFACE_WITH_ANNOTATIONS, null, 2))
          }
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load annotated interface (corpus URI)
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "220px",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "12px",
          padding: "8px",
          resize: "vertical",
        }}
      />

      <label style={{ fontSize: "13px", display: "flex", gap: "6px" }}>
        <input
          type="checkbox"
          checked={emitFairness}
          onChange={(e) => setEmitFairness(e.target.checked)}
        />
        Emit additional Fairness gap marker
      </label>

      <label
        style={{
          fontSize: "13px",
          display: "flex",
          gap: "6px",
          flexDirection: "column",
        }}
      >
        <span>
          Corpus root (optional) — resolves{" "}
          <code>@mununu_interface contract://</code> URIs:
        </span>
        <input
          type="text"
          value={corpusPath}
          onChange={(e) => setCorpusPath(e.target.value)}
          placeholder="/path/to/mununu/corpus"
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
          }}
        />
      </label>

      <div>
        <button
          type="button"
          onClick={onDiscover}
          disabled={pending}
          style={{
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {pending ? "Discovering…" : "Run discovery"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#fde2e2",
            color: "#8a1f1f",
            borderRadius: "4px",
            fontSize: "13px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {output && <Phase1OutputView output={output} />}
    </div>
  );
};

const Phase1OutputView = ({ output }: { output: Phase1Output }) => {
  return (
    <div
      style={{
        padding: "12px",
        background: "#f7f7f7",
        borderLeft: "4px solid #4a8acb",
        borderRadius: "2px",
        fontSize: "13px",
      }}
    >
      <strong style={{ fontSize: "14px" }}>
        Phase-1 discovery for `{output.module}` — {output.labels.length}{" "}
        label(s), {output.gaps.markers.length} gap marker(s)
      </strong>

      <div style={{ marginTop: "10px" }}>
        <em>labels:</em>
        <table
          style={{
            width: "100%",
            marginTop: "4px",
            fontSize: "12px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "4px" }}>name</th>
              <th style={{ textAlign: "left", padding: "4px" }}>direction</th>
              <th style={{ textAlign: "left", padding: "4px" }}>
                controllability
              </th>
            </tr>
          </thead>
          <tbody>
            {output.labels.map((l) => (
              <tr key={l.name} style={{ borderBottom: "1px solid #eee" }}>
                <td
                  style={{
                    padding: "4px",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {l.name}
                </td>
                <td style={{ padding: "4px" }}>{l.direction}</td>
                <td style={{ padding: "4px" }}>
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: "3px",
                      background:
                        l.controllability === "Controllable"
                          ? "#dff0d8"
                          : l.controllability === "Uncontrollable"
                            ? "#f8d7da"
                            : "#e9ecef",
                      color: "#333",
                    }}
                  >
                    {l.controllability}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {output.gaps.markers.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <em>gap markers:</em>
          <ul style={{ margin: "4px 0 0 20px" }}>
            {output.gaps.markers.map((m, idx) => (
              <li key={idx} style={{ marginBottom: "6px" }}>
                <strong>{m.kind}</strong>
                {m.labels.length > 0 && (
                  <span style={{ opacity: 0.85 }}>
                    {" on {"}
                    {m.labels.join(", ")}
                    {"}"}
                  </span>
                )}
                {m.description && (
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    {m.description}
                  </div>
                )}
                {m.source_location && (
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    at {m.source_location.file}:{m.source_location.line}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {output.corpus_resolutions && output.corpus_resolutions.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <em>corpus resolutions:</em>
          <ul style={{ margin: "4px 0 0 20px" }}>
            {output.corpus_resolutions.map((r, idx) => (
              <li key={idx} style={{ marginBottom: "6px" }}>
                <CorpusResolutionLine resolution={r} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CorpusResolutionLine = ({
  resolution,
}: {
  resolution: CorpusResolution;
}) => {
  const badge = corpusStatusBadge(resolution.status);
  return (
    <>
      <span
        style={{
          padding: "1px 6px",
          marginRight: "6px",
          borderRadius: "3px",
          background: badge.bg,
          color: badge.fg,
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {badge.label}
      </span>
      <code style={{ fontSize: "12px" }}>{resolution.raw_uri}</code>
      {resolution.matched_ids.length > 0 && (
        <div style={{ fontSize: "12px", opacity: 0.85, marginLeft: "24px" }}>
          → {resolution.matched_ids.join(", ")}
          {resolution.alternative_matched !== undefined &&
            resolution.alternative_matched !== null && (
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                {resolution.alternative_matched
                  ? `[alt \`${resolution.parsed.alternative}\` ok]`
                  : `[alt \`${resolution.parsed.alternative}\` MISSING on entry]`}
              </span>
            )}
        </div>
      )}
      {resolution.status === "no_corpus" && (
        <div style={{ fontSize: "11px", opacity: 0.7, marginLeft: "24px" }}>
          (supply a Corpus root above to resolve)
        </div>
      )}
    </>
  );
};

const corpusStatusBadge = (
  status: CorpusResolution["status"],
): { bg: string; fg: string; label: string } => {
  switch (status) {
    case "resolved":
      return { bg: "#dff0d8", fg: "#1f5a1f", label: "resolved" };
    case "not_found":
      return { bg: "#fdebd0", fg: "#7a3d00", label: "not found" };
    case "no_corpus":
      return { bg: "#e9ecef", fg: "#444", label: "no corpus" };
    case "malformed":
      return { bg: "#f8d7da", fg: "#8a1f1f", label: "malformed" };
    case "sidecar_reference":
      return { bg: "#e7e6f7", fg: "#3a3a8a", label: "sidecar" };
  }
};

// ============================================================================
// Corpus query sub-panel — Document D §D.2
// ============================================================================

const EXAMPLE_QUERY = {
  id: "rtl_crypto/aes_ctr",
  corpus: "corpus",
  parameters: {} as Record<string, unknown>,
};

const QuerySubPanel = () => {
  const [id, setId] = useState<string>(EXAMPLE_QUERY.id);
  const [corpusPath, setCorpusPath] = useState<string>(EXAMPLE_QUERY.corpus);
  const [paramsText, setParamsText] = useState<string>(
    JSON.stringify(EXAMPLE_QUERY.parameters, null, 2),
  );
  const [response, setResponse] = useState<ContractQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onQuery = async () => {
    setError(null);
    setResponse(null);
    setPending(true);
    try {
      const parameters = JSON.parse(paramsText) as Record<string, unknown>;
      const result = await queryCorpus({
        id: id.trim(),
        corpus: corpusPath.trim(),
        parameters,
      });
      setResponse(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        height: "100%",
        overflow: "auto",
      }}
    >
      <div>
        <h3 style={{ margin: 0, marginBottom: "4px" }}>
          Contract corpus query (D §D.2)
        </h3>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>
          Browse the contract corpus directly. Supply a{" "}
          <code>&lt;domain&gt;/&lt;name&gt;</code> identifier and optional
          parameter constraints; the backend returns the ranked candidate list
          (parameter-match exactness → provenance trust tier → version
          descending).
        </p>
      </div>

      <label
        style={{
          fontSize: "13px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        Contract id (<code>domain/name</code>):
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="rtl_crypto/aes_ctr"
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
          }}
        />
      </label>

      <label
        style={{
          fontSize: "13px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        Corpus root:
        <input
          type="text"
          value={corpusPath}
          onChange={(e) => setCorpusPath(e.target.value)}
          placeholder="/path/to/mununu/corpus"
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
          }}
        />
      </label>

      <label
        style={{
          fontSize: "13px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        Parameters (JSON object, optional):
        <textarea
          value={paramsText}
          onChange={(e) => setParamsText(e.target.value)}
          spellCheck={false}
          style={{
            minHeight: "80px",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "12px",
            padding: "8px",
            resize: "vertical",
          }}
        />
      </label>

      <div>
        <button
          type="button"
          onClick={onQuery}
          disabled={pending}
          style={{
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {pending ? "Querying…" : "Query corpus"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#fde2e2",
            color: "#8a1f1f",
            borderRadius: "4px",
            fontSize: "13px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && <CorpusQueryResultView response={response} />}
    </div>
  );
};

const CorpusQueryResultView = ({
  response,
}: {
  response: ContractQueryResponse;
}) => {
  if (response.candidates.length === 0) {
    return (
      <div
        style={{
          padding: "12px",
          background: "#fdebd0",
          borderLeft: "4px solid #d68900",
          borderRadius: "2px",
          fontSize: "13px",
        }}
      >
        No matching entries in the corpus.
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "12px",
        background: "#f7f7f7",
        borderLeft: "4px solid #4a8acb",
        borderRadius: "2px",
        fontSize: "13px",
      }}
    >
      <strong style={{ fontSize: "14px" }}>
        {response.candidates.length} candidate(s)
      </strong>
      <ul style={{ margin: "8px 0 0 20px" }}>
        {response.candidates.map((entry, idx) => (
          <li
            key={`${entry.id}@${entry.version}-${idx}`}
            style={{ marginBottom: "10px" }}
          >
            <CorpusEntryView entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const CorpusEntryView = ({ entry }: { entry: ContractEntry }) => {
  const tier =
    entry.provenance.tier === "mununu_verified"
      ? "mununu-verified"
      : entry.provenance.tier === "vendor"
        ? `vendor:${entry.provenance.name}`
        : "community";
  return (
    <>
      <strong style={{ fontFamily: "ui-monospace, monospace" }}>
        {entry.id} @ {entry.version}
      </strong>
      <span
        style={{
          marginLeft: "8px",
          fontSize: "11px",
          padding: "1px 6px",
          borderRadius: "3px",
          background: "#e9ecef",
          color: "#333",
        }}
      >
        {tier}
      </span>
      {entry.soundness_flag && (
        <span
          style={{
            marginLeft: "6px",
            fontSize: "11px",
            padding: "1px 6px",
            borderRadius: "3px",
            background: "#dff0d8",
            color: "#1f5a1f",
          }}
        >
          {entry.soundness_flag}
        </span>
      )}
      {entry.description && (
        <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px" }}>
          {entry.description}
        </div>
      )}
      {entry.alternatives && entry.alternatives.length > 0 && (
        <div style={{ fontSize: "12px", marginTop: "4px" }}>
          <em>alternatives:</em>{" "}
          {entry.alternatives.map((a, i) => (
            <span
              key={a.id}
              style={{
                marginRight: "8px",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {i > 0 && " · "}
              {a.id}
            </span>
          ))}
        </div>
      )}
    </>
  );
};

// ============================================================================
// Review sub-panel — HITL stage 4 (Document A §A7 / Document D §D.8)
// ============================================================================

const EXAMPLE_REVIEW_INTERFACE: BlackBoxInterface = {
  name: "AES_CTR_v1",
  ports: [
    { name: "clk", direction: "Input" },
    { name: "start", direction: "Input" },
    { name: "done", direction: "Output" },
    { name: "cipher_out", direction: "Output" },
  ],
  source_file: "rtl/vendor/aes_ctr_v1.sv",
  source_line: 8,
  annotations: [
    { tag: "blackbox", value: "" },
    {
      tag: "interface",
      value: "contract://rtl_crypto/aes_ctr@1.0.0?alt=strict_iv",
    },
    { tag: "guarantee", value: "G(start -> eventually done)" },
    { tag: "assume", value: "G(start -> !reset)" },
  ],
};

const ReviewSubPanel = () => {
  const [text, setText] = useState<string>(
    JSON.stringify(EXAMPLE_REVIEW_INTERFACE, null, 2),
  );
  const [corpusPath, setCorpusPath] = useState<string>("");
  const [pkg, setPkg] = useState<ReviewPackage | null>(null);
  const [decisions, setDecisions] = useState<
    Record<string, "pending" | "accepted" | "rejected">
  >({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onReview = async () => {
    setError(null);
    setPkg(null);
    setDecisions({});
    setPending(true);
    try {
      const iface = JSON.parse(text) as BlackBoxInterface;
      const trimmed = corpusPath.trim();
      const result = await reviewContract({
        interface: iface,
        ...(trimmed ? { corpus: trimmed } : {}),
      });
      setPkg(result);
      const initial: Record<string, "pending" | "accepted" | "rejected"> = {};
      for (const c of result.proposed_clauses) {
        initial[c.id] = "pending";
      }
      setDecisions(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  };

  const setDecision = (
    id: string,
    decision: "pending" | "accepted" | "rejected",
  ) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  const counts = pkg
    ? pkg.proposed_clauses.reduce(
        (acc, c) => {
          acc[decisions[c.id] ?? "pending"]++;
          return acc;
        },
        { pending: 0, accepted: 0, rejected: 0 },
      )
    : { pending: 0, accepted: 0, rejected: 0 };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        height: "100%",
        overflow: "auto",
      }}
    >
      <div>
        <h3 style={{ margin: 0, marginBottom: "4px" }}>
          HITL stage-4 review (A §A7 / D §D.8)
        </h3>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>
          Walks a black-box interface through the proposal pipeline: phase-2
          discovery + one proposed clause per <code>@mununu_assume</code> /{" "}
          <code>@mununu_guarantee</code> and one corpus-reference proposal per
          resolved <code>@mununu_interface contract://</code>. Mark each
          proposal <em>Accept</em> or <em>Reject</em>; the decisions are
          surface-side state — accepted clauses are the inputs to the discharge
          check, not auto-applied by mununu.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "200px",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "12px",
          padding: "8px",
          resize: "vertical",
        }}
      />

      <label
        style={{
          fontSize: "13px",
          display: "flex",
          gap: "6px",
          flexDirection: "column",
        }}
      >
        <span>
          Corpus root (optional) — resolves{" "}
          <code>@mununu_interface contract://</code> URIs into reference
          proposals:
        </span>
        <input
          type="text"
          value={corpusPath}
          onChange={(e) => setCorpusPath(e.target.value)}
          placeholder="/path/to/mununu/corpus"
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
          }}
        />
      </label>

      <div>
        <button
          type="button"
          onClick={onReview}
          disabled={pending}
          style={{
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {pending ? "Building review…" : "Run stage-4 review"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "#fde2e2",
            color: "#8a1f1f",
            borderRadius: "4px",
            fontSize: "13px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {pkg && (
        <ReviewPackageView
          pkg={pkg}
          decisions={decisions}
          onDecision={setDecision}
          counts={counts}
        />
      )}
    </div>
  );
};

const ReviewPackageView = ({
  pkg,
  decisions,
  onDecision,
  counts,
}: {
  pkg: ReviewPackage;
  decisions: Record<string, "pending" | "accepted" | "rejected">;
  onDecision: (
    id: string,
    decision: "pending" | "accepted" | "rejected",
  ) => void;
  counts: { pending: number; accepted: number; rejected: number };
}) => {
  return (
    <div
      style={{
        padding: "12px",
        background: "#f7f7f7",
        borderLeft: "4px solid #4a8acb",
        borderRadius: "2px",
        fontSize: "13px",
      }}
    >
      <strong style={{ fontSize: "14px" }}>
        Review package for `{pkg.module}` — {pkg.proposed_clauses.length}{" "}
        proposal(s)
      </strong>
      <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.85 }}>
        alphabet: {pkg.phase1.labels.length} label(s),{" "}
        {pkg.phase1.gaps.markers.length} gap marker(s).{" "}
        <strong>Decisions:</strong> {counts.accepted} accepted ·{" "}
        {counts.rejected} rejected · {counts.pending} pending.
      </div>

      {pkg.proposed_clauses.length === 0 ? (
        <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.8 }}>
          No proposals — the interface has no <code>@mununu_assume</code> /{" "}
          <code>@mununu_guarantee</code> clauses and no resolved corpus
          references. Try the annotated example above or supply a corpus root.
        </div>
      ) : (
        <ul style={{ margin: "10px 0 0 0", paddingLeft: "20px" }}>
          {pkg.proposed_clauses.map((c) => (
            <li key={c.id} style={{ marginBottom: "10px" }}>
              <ProposalCard
                clause={c}
                decision={decisions[c.id] ?? "pending"}
                onDecision={(d) => onDecision(c.id, d)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ProposalCard = ({
  clause,
  decision,
  onDecision,
}: {
  clause: ProposedClause;
  decision: "pending" | "accepted" | "rejected";
  onDecision: (d: "pending" | "accepted" | "rejected") => void;
}) => {
  const decisionStyle = {
    pending: { bg: "#e9ecef", fg: "#444", label: "pending" },
    accepted: { bg: "#dff0d8", fg: "#1f5a1f", label: "accepted" },
    rejected: { bg: "#f8d7da", fg: "#8a1f1f", label: "rejected" },
  }[decision];
  return (
    <div
      style={{
        padding: "8px 10px",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "3px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <strong
          style={{ fontFamily: "ui-monospace, monospace", fontSize: "12px" }}
        >
          {clause.id}
        </strong>
        <span
          style={{
            padding: "1px 6px",
            borderRadius: "3px",
            background: kindColour(clause.kind).bg,
            color: kindColour(clause.kind).fg,
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          {clause.kind}
        </span>
        <span
          style={{
            marginLeft: "auto",
            padding: "1px 6px",
            borderRadius: "3px",
            background: decisionStyle.bg,
            color: decisionStyle.fg,
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {decisionStyle.label}
        </span>
      </div>
      {clause.description && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            fontFamily: "ui-monospace, monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          {clause.description}
        </div>
      )}
      <div
        style={{
          marginTop: "4px",
          fontSize: "11px",
          opacity: 0.7,
        }}
      >
        source: {renderProposalProvenance(clause.provenance)}
      </div>
      {clause.soundness_note && (
        <div
          style={{
            marginTop: "4px",
            fontSize: "11px",
            opacity: 0.8,
            fontStyle: "italic",
          }}
        >
          {clause.soundness_note}
        </div>
      )}
      <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
        <button
          type="button"
          onClick={() => onDecision("accepted")}
          disabled={decision === "accepted"}
          style={{
            padding: "3px 10px",
            fontSize: "12px",
            background: decision === "accepted" ? "#dff0d8" : undefined,
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onDecision("rejected")}
          disabled={decision === "rejected"}
          style={{
            padding: "3px 10px",
            fontSize: "12px",
            background: decision === "rejected" ? "#f8d7da" : undefined,
          }}
        >
          Reject
        </button>
        {decision !== "pending" && (
          <button
            type="button"
            onClick={() => onDecision("pending")}
            style={{ padding: "3px 10px", fontSize: "12px" }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

const kindColour = (kind: string): { bg: string; fg: string } => {
  switch (kind) {
    case "assumption":
      return { bg: "#fdebd0", fg: "#7a3d00" };
    case "guarantee":
      return { bg: "#dff0d8", fg: "#1f5a1f" };
    case "invariant":
      return { bg: "#e7e6f7", fg: "#3a3a8a" };
    case "reference":
      return { bg: "#d9edf7", fg: "#1f4a7a" };
    default:
      return { bg: "#e9ecef", fg: "#333" };
  }
};

const renderProposalProvenance = (p: ProposalProvenance): string => {
  if (p.source === "source_comment") {
    return p.source_line !== undefined && p.source_line !== null
      ? `@mununu_${p.tag} (line ${p.source_line})`
      : `@mununu_${p.tag}`;
  }
  return p.alternative
    ? `corpus:${p.entry_id} alt=${p.alternative}`
    : `corpus:${p.entry_id}`;
};
