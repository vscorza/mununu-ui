import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SvExtractSvaRunner } from "../SvExtractSvaRunner";
import { useExtractionStore } from "../../../store/extractionStore";
import * as endpoints from "../../../api/endpoints";

vi.mock("../../../api/endpoints", async () => {
  const actual = await vi.importActual<typeof import("../../../api/endpoints")>(
    "../../../api/endpoints",
  );
  return {
    ...actual,
    runSvExtractSva: vi.fn(),
  };
});

const SV = `module m (input logic clk, input logic a, input logic b);
  ap: assert property (@(posedge clk) a |-> b);
  cp: cover property (@(posedge clk) a && b);
endmodule
`;

describe("SvExtractSvaRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExtractionStore.getState().resetWorkflow();
    useExtractionStore.setState({
      sourceContent: SV,
      sourceFileName: "m.sv",
      additionalSources: [],
    });
  });

  it("shows the loaded SV filename and an Extract button", () => {
    render(<SvExtractSvaRunner />);
    expect(screen.getByText("m.sv")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Extract SVA/i }),
    ).toBeInTheDocument();
  });

  it("posts the SV source and renders the translated property set", async () => {
    const mocked = vi.mocked(endpoints.runSvExtractSva);
    mocked.mockResolvedValue({
      translated: [
        {
          name: "m_sva_0",
          kind: "assert",
          formula: "nu X. ((!(a) || b) && [] X)",
          recoverability_companion: null,
        },
        {
          name: "m_sva_1",
          kind: "cover",
          formula: "mu X. ((a && b) || <> X)",
          recoverability_companion:
            "nu Y. ((mu X. ((a && b) || <> X)) && [] Y)",
        },
      ],
      unsupported: [],
      required_shadows: [],
    });

    render(<SvExtractSvaRunner />);
    fireEvent.click(screen.getByRole("button", { name: /Extract SVA/i }));

    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(1);
    });
    const arg = mocked.mock.calls[0]?.[0];
    expect(arg?.source).toContain("module m");

    // The translated formulas + the cover's recoverability companion render.
    await waitFor(() => {
      expect(screen.getByText("m_sva_0")).toBeInTheDocument();
    });
    expect(screen.getByText("m_sva_1")).toBeInTheDocument();
    expect(screen.getByText(/nu Y\. \(\(mu X\./)).toBeInTheDocument();
  });

  it("surfaces the required __past shadow registers", async () => {
    const mocked = vi.mocked(endpoints.runSvExtractSva);
    mocked.mockResolvedValue({
      translated: [
        {
          name: "m_sva_0",
          kind: "assert",
          formula: "nu X. ((state_q == state_q__past) && [] X)",
          recoverability_companion: null,
        },
      ],
      unsupported: [
        { name: "m_sva_1", kind: "assert", reason: "system call $onehot0" },
      ],
      required_shadows: [{ base: "state_q", width: 6 }],
    });

    render(<SvExtractSvaRunner />);
    fireEvent.click(screen.getByRole("button", { name: /Extract SVA/i }));

    await waitFor(() => {
      expect(screen.getByText(/state_q\(6\)/)).toBeInTheDocument();
    });
    expect(screen.getByText(/system call \$onehot0/)).toBeInTheDocument();
  });

  it("blocks extraction when no SV source is loaded", async () => {
    const mocked = vi.mocked(endpoints.runSvExtractSva);
    useExtractionStore.setState({ sourceContent: "", sourceFileName: "" });
    render(<SvExtractSvaRunner />);
    fireEvent.click(screen.getByRole("button", { name: /Extract SVA/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/No SystemVerilog source loaded/i),
      ).toBeInTheDocument();
    });
    expect(mocked).not.toHaveBeenCalled();
  });
});
