import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SvVerifyAutoRunner } from "../SvVerifyAutoRunner";
import { useExtractionStore } from "../../../store/extractionStore";
import * as endpoints from "../../../api/endpoints";

vi.mock("../../../api/endpoints", async () => {
  const actual = await vi.importActual<typeof import("../../../api/endpoints")>(
    "../../../api/endpoints",
  );
  return {
    ...actual,
    runSvVerifyAuto: vi.fn(),
  };
});

const SV = `module fsm (input logic clk, input logic rst_n);
  logic [1:0] state;
  always_ff @(posedge clk) state <= rst_n ? state + 2'd1 : 2'd0;
  ok: assert property (@(posedge clk) state != 2'd3);
endmodule
`;

describe("SvVerifyAutoRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExtractionStore.getState().resetWorkflow();
    useExtractionStore.setState({
      sourceContent: SV,
      sourceFileName: "fsm.sv",
      additionalSources: [],
    });
  });

  it("shows the loaded SV filename and a verify button", () => {
    render(<SvVerifyAutoRunner />);
    expect(screen.getByText("fsm.sv")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Verify all properties/i }),
    ).toBeInTheDocument();
  });

  it("posts the SV source + options and renders per-property verdicts", async () => {
    const mocked = vi.mocked(endpoints.runSvVerifyAuto);
    mocked.mockResolvedValue({
      properties: [
        {
          name: "fsm_sva_0",
          kind: "assert",
          formula: "nu X. ((state != 3) && [] X)",
          outcome: "holds",
          detail: null,
          seeded_predicates: ["state != 3"],
        },
        {
          name: "fsm_sva_1",
          kind: "assert",
          formula: "nu X. ((state == 1) && [] X)",
          outcome: "violated",
          detail: "1 cell(s)",
          seeded_predicates: ["state == 1"],
        },
        {
          name: "fsm_sva_2",
          kind: "assert",
          formula: "nu X. (gnt_o && [] X)",
          outcome: "skipped",
          detail: "atom over non-state signal: gnt_o",
          seeded_predicates: [],
        },
      ],
      unsupported: [],
      diagnostics: {
        state_register_count: 2,
        blackboxed_modules: [],
        gated_resets: ["rst_ni=1"],
        auto_provided_stubs: ["prim_sparse_fsm_flop"],
      },
      notes: [
        {
          kind: "coverage-summary",
          level: "info",
          summary: "3 assertion(s): 1 definite (HOLDS), 1 violated, 0 unknown (⊥), 1 skipped",
          detail: "A definite verdict transfers to the RTL.",
          items: [],
        },
        {
          kind: "config-concretization",
          level: "scope-caveat",
          summary: "1 config input(s) pinned to constants.",
          detail: "Verdicts are scoped to this configuration.",
          items: ["cfg_detect_timer_i=7"],
        },
      ],
    });

    render(<SvVerifyAutoRunner />);
    fireEvent.change(screen.getByLabelText("Must-edge inference"), {
      target: { value: "smt-hyper-must" },
    });
    // H.J.b — config concretization: comma-separated `signal=value` entries are
    // parsed into the request's `config_values` array.
    fireEvent.change(screen.getByLabelText("Config concretization"), {
      target: { value: "cfg_detect_timer_i=7, cfg_debounce_timer_i=1" },
    });
    // H.H — counter bounds: comma-separated `signal<=value` entries are parsed
    // into the request's `counter_bounds` array.
    fireEvent.change(screen.getByLabelText("Counter bounds"), {
      target: { value: "cnt_q<=7" },
    });
    // R-F5.5d — the engine selector (default explicit) posts `engine`.
    expect(screen.getByLabelText("Engine")).toHaveValue("explicit");
    fireEvent.change(screen.getByLabelText("Engine"), {
      target: { value: "symbolic" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Verify all properties/i }),
    );

    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(1);
    });
    const arg = mocked.mock.calls[0]?.[0];
    expect(arg?.source).toContain("module fsm");
    expect(arg?.engine).toBe("symbolic");
    expect(arg?.must_edge_inference).toBe("smt-hyper-must");
    expect(arg?.use_sv2v).toBe(true);
    expect(arg?.gate_reset).toBe(true);
    expect(arg?.auto_stub_flops).toBe(true);
    expect(arg?.config_values).toEqual([
      "cfg_detect_timer_i=7",
      "cfg_debounce_timer_i=1",
    ]);
    expect(arg?.counter_bounds).toEqual(["cnt_q<=7"]);

    // All three properties render, with their headline verdicts + skip reason.
    await waitFor(() => {
      expect(screen.getByText("fsm_sva_0")).toBeInTheDocument();
    });
    const liText = (name: string) =>
      screen.getByText(name).closest("li")?.textContent ?? "";
    expect(liText("fsm_sva_0")).toContain("HOLDS");
    expect(liText("fsm_sva_1")).toContain("VIOLATED (1 cell(s))");
    expect(liText("fsm_sva_2")).toContain("SKIPPED");
    expect(
      screen.getByText(/atom over non-state signal: gnt_o/),
    ).toBeInTheDocument();

    // Model diagnostics render: the auto-stubbed flop (single text node)
    // anchors the diagnostics paragraph; the paragraph also carries the
    // state-register count + reset-gating.
    const stub = screen.getByText(/auto-stubbed flop primitives.*prim_sparse_fsm_flop/);
    const diagText = stub.closest("p")?.textContent ?? "";
    expect(diagText).toMatch(/state register/);
    expect(diagText).toMatch(/\b2\b/);
    expect(diagText).toMatch(/reset-gated.*rst_ni=1/);

    // H.J — the provenance notes panel renders each note with its summary,
    // and the config-concretization scope caveat carries the pinned value.
    expect(
      screen.getByText(/Notes \(decisions that shaped these verdicts\)/),
    ).toBeInTheDocument();
    const configNote = screen
      .getByText(/1 config input\(s\) pinned to constants/)
      .closest("li")?.textContent ?? "";
    expect(configNote).toContain("scope");
    expect(configNote).toContain("cfg_detect_timer_i=7");
  });

  it("blocks verification when no SV source is loaded", async () => {
    const mocked = vi.mocked(endpoints.runSvVerifyAuto);
    useExtractionStore.setState({ sourceContent: "", sourceFileName: "" });
    render(<SvVerifyAutoRunner />);
    fireEvent.click(
      screen.getByRole("button", { name: /Verify all properties/i }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(/No SystemVerilog source loaded/i),
      ).toBeInTheDocument();
    });
    expect(mocked).not.toHaveBeenCalled();
  });
});
