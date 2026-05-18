import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CounterexampleTrace } from "../CounterexampleTrace";
import type { VerifyTraceWitness } from "../../../api/endpoints";

const cycleWitness: VerifyTraceWitness = {
  initial_state: "closed|locked",
  steps: [
    { label: "tick_gate", successor_state: "open|locked" },
    { label: "open_request", successor_state: "open|unlocked" },
    { label: "tick_gate", successor_state: "closed|unlocked" },
    { label: "close_request", successor_state: "closed|locked" },
  ],
  termination: { kind: "cycle", return_to_step: 0 },
};

const sinkWitness: VerifyTraceWitness = {
  initial_state: "init",
  steps: [{ label: "step_a", successor_state: "halt" }],
  termination: { kind: "sink" },
};

const lengthLimitWitness: VerifyTraceWitness = {
  initial_state: "s0",
  steps: Array.from({ length: 5 }, (_, i) => ({
    label: `lab_${i}`,
    successor_state: `s${i + 1}`,
  })),
  termination: { kind: "length_limit" },
};

const emptyWitness: VerifyTraceWitness = {
  initial_state: "isolated",
  steps: [],
  termination: { kind: "sink" },
};

const multiLabelWitness: VerifyTraceWitness = {
  initial_state: "s0",
  steps: [{ label: "a,b,c", successor_state: "s1" }],
  termination: { kind: "sink" },
};

describe("CounterexampleTrace", () => {
  it("renders the initial state, each step, and a cycle terminator", () => {
    render(<CounterexampleTrace witness={cycleWitness} />);
    // initial_state and the final successor are the same (the cycle
    // closes onto the initial state), so the label appears twice.
    expect(screen.getAllByText("closed|locked")).toHaveLength(2);
    expect(screen.getByText("open|locked")).toBeInTheDocument();
    expect(screen.getByText("close_request")).toBeInTheDocument();
    expect(screen.getByText(/cycle: re-enters step 1/)).toBeInTheDocument();
    expect(screen.getByText(/initial state/)).toBeInTheDocument();
  });

  it("renders a sink terminator", () => {
    render(<CounterexampleTrace witness={sinkWitness} />);
    expect(
      screen.getByText(/terminated at a sink/),
    ).toBeInTheDocument();
  });

  it("renders a length-limit terminator", () => {
    render(<CounterexampleTrace witness={lengthLimitWitness} />);
    expect(
      screen.getByText(/truncated at the 20-step length cap/),
    ).toBeInTheDocument();
  });

  it("renders a friendly note when steps is empty", () => {
    render(<CounterexampleTrace witness={emptyWitness} />);
    expect(
      screen.getByText(/no outgoing transitions/),
    ).toBeInTheDocument();
  });

  it("splits comma-joined multi-label payloads into individual chips", () => {
    render(<CounterexampleTrace witness={multiLabelWitness} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
  });
});
