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
  type ContractSet,
  type DischargeVerdict,
  type BlackBoxInterface,
  type Phase1Output,
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

type SubTab = "validate" | "discover";

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
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {subTab === "validate" ? <ValidateSubPanel /> : <DiscoverSubPanel />}
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
          runs Tarjan SCC over the guarantor→consumer graph and reports
          whether the discharge is acyclic, circular, potentially circular
          (unresolved clauses), or unmet (some assumption has no
          discharger).
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() =>
            setText(JSON.stringify(EXAMPLE_ACYCLIC, null, 2))
          }
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load acyclic example
        </button>
        <button
          type="button"
          onClick={() =>
            setText(JSON.stringify(EXAMPLE_CIRCULAR, null, 2))
          }
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          Load circular example
        </button>
        <button
          type="button"
          onClick={() =>
            setText(JSON.stringify(EXAMPLE_RANK_WITNESS, null, 2))
          }
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
                  base edge: {witness.base_edge[0]} →{" "}
                  {witness.base_edge[1]}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: "8px", fontSize: "12px", opacity: 0.85 }}>
            Mununu auto-accepts these via the lightweight McMillan check
            (Document A task A8): every cycle has a strict mu-rank
            descent except at the marked base edge, witnessing well-
            founded induction.
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
            approve, or one cycle clause must be rewritten to be
            unconditional. Tip: assign <code>mu_rank</code> to each clause
            to enable the lightweight McMillan auto-discharge (A8).
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
  const [output, setOutput] = useState<Phase1Output | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onDiscover = async () => {
    setError(null);
    setOutput(null);
    setPending(true);
    try {
      const iface = JSON.parse(text) as BlackBoxInterface;
      const result = await discoverContract({
        interface: iface,
        emit_fairness_gap: emitFairness,
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
          Black-box interface discovery (phase 1)
        </h3>
        <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>
          Paste a black-box interface description as JSON (module name + port
          list + directions). The backend classifies each label via the shared
          controllability rule and emits gap markers describing what is not
          yet known — phase 1 of Document A task A5.
        </p>
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
          {pending ? "Discovering…" : "Run phase-1 discovery"}
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
    </div>
  );
};
