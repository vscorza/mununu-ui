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
    });

    render(<SvVerifyAutoRunner />);
    fireEvent.change(screen.getByLabelText("Must-edge inference"), {
      target: { value: "smt-hyper-must" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Verify all properties/i }),
    );

    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(1);
    });
    const arg = mocked.mock.calls[0]?.[0];
    expect(arg?.source).toContain("module fsm");
    expect(arg?.must_edge_inference).toBe("smt-hyper-must");
    expect(arg?.use_sv2v).toBe(true);

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
