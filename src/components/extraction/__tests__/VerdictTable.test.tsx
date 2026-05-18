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
});
