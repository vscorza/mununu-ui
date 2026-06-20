import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RefinementTracePanel } from "../RefinementTracePanel";
import * as endpoints from "../../../api/endpoints";

vi.mock("../../../api/endpoints", async () => {
  const actual = await vi.importActual<typeof import("../../../api/endpoints")>(
    "../../../api/endpoints",
  );
  return {
    ...actual,
    runBtor2Cegar: vi.fn(),
  };
});

describe("RefinementTracePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with the BTOR2 template and a default formula", () => {
    render(<RefinementTracePanel />);
    expect(
      screen.getByText(/CEGAR refinement-trace viewer/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Run CEGAR refinement/i }),
    ).toBeInTheDocument();
    // Default formula preloaded in the formula input.
    expect(screen.getByLabelText("Formula")).toHaveValue("nu X. <true> X");
  });

  it("posts the BTOR2, formula, and parsed predicates to runBtor2Cegar", async () => {
    const mocked = vi.mocked(endpoints.runBtor2Cegar);
    mocked.mockResolvedValue({
      success: true,
      iterations: [
        {
          iteration: 0,
          predicate_count: 1,
          had_failure_subgame: false,
          predicates_added: [],
          game_position_evaluations: 4,
          verdict: { true_cells: 2, false_cells: 0, unknown_cells: 0 },
        },
      ],
      final_predicates: [{ name: "r_zero", register: "r", value: 0 }],
      terminated_with: "converged",
      verdict: { true_cells: 2, false_cells: 0, unknown_cells: 0 },
      lazy_lift_pending: true,
      approximant_reuse_enabled: false,
      warnings: [],
    });

    render(<RefinementTracePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Run CEGAR refinement/i }),
    );

    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(1);
    });
    const arg = mocked.mock.calls[0]?.[0];
    expect(arg?.formula).toBe("nu X. <true> X");
    expect(arg?.predicates).toEqual([{ name: "r_zero", register: "r", value: 0 }]);
    expect(arg?.predicate_source).toBe("wp");
    expect(arg?.max_iterations).toBe(16);
    expect(arg?.content).toContain("state 1 r");
    // M.6 parity defaults: may-edge off, no config-values.
    expect(arg?.may_edge_inference).toBe("off");
    expect(arg?.config_values).toEqual([]);
  });

  it("posts may_edge_inference and config_values when set (M.6 parity)", async () => {
    const mocked = vi.mocked(endpoints.runBtor2Cegar);
    mocked.mockResolvedValue({
      success: true,
      iterations: [],
      final_predicates: [],
      terminated_with: "converged",
      verdict: { true_cells: 0, false_cells: 0, unknown_cells: 0 },
      lazy_lift_pending: false,
      approximant_reuse_enabled: false,
      warnings: [],
    });

    render(<RefinementTracePanel />);
    fireEvent.change(screen.getByLabelText("May-edge inference"), {
      target: { value: "smt-all-pairs" },
    });
    fireEvent.change(screen.getByLabelText("Config values"), {
      target: { value: "boot_fsm_ns=0,1,2,3,4,5,6,7\n" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Run CEGAR refinement/i }),
    );

    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(1);
    });
    const arg = mocked.mock.calls[0]?.[0];
    expect(arg?.may_edge_inference).toBe("smt-all-pairs");
    expect(arg?.config_values).toEqual(["boot_fsm_ns=0,1,2,3,4,5,6,7"]);
  });

  it("renders the iterations table and termination reason from the trace", async () => {
    const mocked = vi.mocked(endpoints.runBtor2Cegar);
    mocked.mockResolvedValue({
      success: true,
      iterations: [
        {
          iteration: 0,
          predicate_count: 1,
          had_failure_subgame: true,
          predicates_added: [{ name: "r_one", register: "r", value: 1 }],
          game_position_evaluations: 8,
          verdict: { true_cells: 1, false_cells: 0, unknown_cells: 1 },
        },
        {
          iteration: 1,
          predicate_count: 2,
          had_failure_subgame: false,
          predicates_added: [],
          game_position_evaluations: 3,
          verdict: { true_cells: 2, false_cells: 0, unknown_cells: 0 },
        },
      ],
      final_predicates: [
        { name: "r_zero", register: "r", value: 0 },
        { name: "r_one", register: "r", value: 1 },
      ],
      terminated_with: "converged",
      verdict: { true_cells: 2, false_cells: 0, unknown_cells: 0 },
      lazy_lift_pending: false,
      approximant_reuse_enabled: true,
      warnings: ["sample soundness warning"],
    });

    render(<RefinementTracePanel />);
    fireEvent.click(
      screen.getByRole("button", { name: /Run CEGAR refinement/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Refinement trace/i)).toBeInTheDocument();
    });
    expect(screen.getByText("converged")).toBeInTheDocument();
    // The added predicate from iteration 0 renders in the table.
    expect(screen.getByText("r==1")).toBeInTheDocument();
    // Both final predicates render.
    expect(screen.getByText(/r_one: r == 1/i)).toBeInTheDocument();
    // The warning surfaces.
    expect(screen.getByText("sample soundness warning")).toBeInTheDocument();
  });

  it("blocks submission and shows an error when predicates are malformed", async () => {
    const mocked = vi.mocked(endpoints.runBtor2Cegar);
    render(<RefinementTracePanel />);
    fireEvent.change(screen.getByLabelText("Initial predicates"), {
      target: { value: "bad row without three fields\n" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Run CEGAR refinement/i }),
    );
    await waitFor(() => {
      expect(screen.getByText(/Invalid predicate row/i)).toBeInTheDocument();
    });
    expect(mocked).not.toHaveBeenCalled();
  });
});
