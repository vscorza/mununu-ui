import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerdictTable } from "../VerdictTable";
import type { VerifyReport } from "../../../api/endpoints";

const baseReport: VerifyReport = {
  project: "Demo",
  sources: [{ id: "wf", adapter: "langgraph", automaton: "TicketTriage" }],
  composition: {
    semantics: "asynchronous",
    name: "Triage",
    members: ["TicketTriage"],
  },
  property_verdicts: [
    {
      name: "done_reachable",
      formula_source: {
        kind: "template",
        id: "reachable",
        args: { TARGET: "done" },
      },
      formula: "mu X. (done || <> X)",
      over: "Triage",
      satisfied: true,
      total_states: 4,
      satisfying_states: 4,
      initial_states: ["classify"],
      initial_satisfying: ["classify"],
    },
    {
      name: "deadlock_free",
      formula_source: { kind: "inline" },
      formula: "nu X. (<> true && [] X)",
      over: "Triage",
      satisfied: false,
      total_states: 4,
      satisfying_states: 1,
      initial_states: ["classify"],
      initial_satisfying: [],
    },
  ],
};

describe("VerdictTable", () => {
  it("renders the project name and composition summary", () => {
    render(<VerdictTable report={baseReport} />);
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText(/properties satisfied/)).toBeInTheDocument();
    expect(screen.getAllByText(/Triage/).length).toBeGreaterThan(0);
    expect(screen.getByText(/asynchronous/)).toBeInTheDocument();
  });

  it("renders one row per property with the verdict label", () => {
    render(<VerdictTable report={baseReport} />);
    expect(screen.getByText("done_reachable")).toBeInTheDocument();
    expect(screen.getByText("deadlock_free")).toBeInTheDocument();
    expect(screen.getByText("SATISFIED")).toBeInTheDocument();
    expect(screen.getByText("VIOLATED")).toBeInTheDocument();
  });

  it("surfaces the template source label when the formula came from a template", () => {
    render(<VerdictTable report={baseReport} />);
    expect(screen.getByText("template:reachable")).toBeInTheDocument();
    expect(screen.getByText("inline")).toBeInTheDocument();
  });

  it("toggles the per-row details row when the row is clicked", async () => {
    const user = userEvent.setup();
    render(<VerdictTable report={baseReport} />);
    // Formula text not initially visible.
    expect(screen.queryByText("mu X. (done || <> X)")).not.toBeInTheDocument();
    // Click the row.
    await user.click(screen.getByText("done_reachable"));
    expect(screen.getByText("mu X. (done || <> X)")).toBeInTheDocument();
    // Template args show up too.
    expect(screen.getByText(/TARGET = done/)).toBeInTheDocument();
  });

  it("handles an empty property_verdicts list without crashing", () => {
    const empty: VerifyReport = {
      ...baseReport,
      property_verdicts: [],
    };
    render(<VerdictTable report={empty} />);
    expect(screen.getByText("Demo")).toBeInTheDocument();
    // No verdict pills when there are no verdicts.
    expect(screen.queryByText("SATISFIED")).not.toBeInTheDocument();
    expect(screen.queryByText("VIOLATED")).not.toBeInTheDocument();
  });

  it("surfaces the counterexample trace inside the expanded row when present", async () => {
    const user = userEvent.setup();
    const withCe: VerifyReport = {
      ...baseReport,
      property_verdicts: baseReport.property_verdicts.map((v) =>
        v.name === "deadlock_free"
          ? {
              ...v,
              counterexample: {
                initial_state: "classify",
                steps: [
                  { label: "ticket_in", successor_state: "triaging" },
                  { label: "noop", successor_state: "classify" },
                ],
                termination: { kind: "cycle", return_to_step: 0 },
              },
            }
          : v,
      ),
    };
    render(<VerdictTable report={withCe} />);
    // Counterexample only shows when row is expanded.
    expect(screen.queryByText(/Counterexample \(from/)).not.toBeInTheDocument();
    await user.click(screen.getByText("deadlock_free"));
    expect(screen.getByText(/Counterexample \(from/)).toBeInTheDocument();
    expect(screen.getByText("ticket_in")).toBeInTheDocument();
    expect(screen.getByText(/cycle: re-enters step 1/)).toBeInTheDocument();
  });

  it("does not render a counterexample section when satisfied", async () => {
    const user = userEvent.setup();
    render(<VerdictTable report={baseReport} />);
    await user.click(screen.getByText("done_reachable"));
    expect(screen.queryByText(/Counterexample \(from/)).not.toBeInTheDocument();
  });

  it("does not render the clustered-COI block when no source carries one", () => {
    render(<VerdictTable report={baseReport} />);
    expect(
      screen.queryByText(/Clustered cone-of-influence/),
    ).not.toBeInTheDocument();
  });

  it("renders the clustered-COI comparison + reduction badge when present", () => {
    const withClusterCoi: VerifyReport = {
      ...baseReport,
      sources: [
        {
          id: "rtl",
          adapter: "sv-yosys",
          automaton: "Circuit",
          partition_summary: {
            total_signals: 6,
            kept: 6,
            dropped_coi: 0,
            datapath_uf: 0,
            state_bits_before: 6,
            state_bits_after: 6,
            cluster_coi: {
              joint_cone_size: 4,
              clusters: [
                { members: ["propA"], cone_size: 2 },
                { members: ["propB"], cone_size: 2 },
              ],
              max_cluster_cone_size: 2,
            },
          },
        },
      ],
    };
    render(<VerdictTable report={withClusterCoi} />);
    expect(screen.getByText(/Clustered cone-of-influence/)).toBeInTheDocument();
    // joint cone 4 · 2 cluster(s) · max cluster cone 2
    expect(
      screen.getByText(/joint cone 4 · 2 cluster\(s\) · max cluster cone 2/),
    ).toBeInTheDocument();
    // reduction badge: −2 signals vs joint COI
    expect(screen.getByText(/−2 signals vs joint COI/)).toBeInTheDocument();
  });

  it("shows the no-reduction badge when clusters don't shrink the cone", () => {
    const noReduction: VerifyReport = {
      ...baseReport,
      sources: [
        {
          id: "rtl",
          adapter: "sv-yosys",
          automaton: "Circuit",
          partition_summary: {
            total_signals: 4,
            kept: 4,
            dropped_coi: 0,
            datapath_uf: 0,
            state_bits_before: 4,
            state_bits_after: 4,
            cluster_coi: {
              joint_cone_size: 4,
              clusters: [{ members: ["propA", "propB"], cone_size: 4 }],
              max_cluster_cone_size: 4,
            },
          },
        },
      ],
    };
    render(<VerdictTable report={noReduction} />);
    expect(screen.getByText(/no reduction/)).toBeInTheDocument();
  });

  it("shows the per-cluster verification badge when cluster_routing is present", () => {
    // R46-4 — when the joint design busts the cap, the backend verifies
    // each cluster separately and reports cluster_routing.
    const perCluster: VerifyReport = {
      ...baseReport,
      sources: [
        {
          id: "rtl",
          adapter: "sv-yosys",
          automaton: "Circuit",
          partition_summary: {
            total_signals: 6,
            kept: 6,
            dropped_coi: 0,
            datapath_uf: 0,
            state_bits_before: 6,
            state_bits_after: 6,
            cluster_coi: {
              joint_cone_size: 4,
              clusters: [
                { members: ["propA"], cone_size: 2 },
                { members: ["propB"], cone_size: 2 },
              ],
              max_cluster_cone_size: 2,
            },
            cluster_routing: {
              propA: "Circuit__cl0",
              propB: "Circuit__cl1",
            },
          },
        },
      ],
    };
    render(<VerdictTable report={perCluster} />);
    // two distinct cluster automata → "2 clusters verified separately"
    expect(
      screen.getByText(/2 clusters verified separately/),
    ).toBeInTheDocument();
  });

  it("does not show the per-cluster badge on the joint path (no cluster_routing)", () => {
    const joint: VerifyReport = {
      ...baseReport,
      sources: [
        {
          id: "rtl",
          adapter: "sv-yosys",
          automaton: "Circuit",
          partition_summary: {
            total_signals: 4,
            kept: 4,
            dropped_coi: 0,
            datapath_uf: 0,
            state_bits_before: 4,
            state_bits_after: 4,
            cluster_coi: {
              joint_cone_size: 4,
              clusters: [
                { members: ["propA"], cone_size: 2 },
                { members: ["propB"], cone_size: 2 },
              ],
              max_cluster_cone_size: 2,
            },
          },
        },
      ],
    };
    render(<VerdictTable report={joint} />);
    expect(screen.queryByText(/verified separately/)).not.toBeInTheDocument();
  });
});
