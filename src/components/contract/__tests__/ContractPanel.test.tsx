import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContractPanel } from "../ContractPanel";
import * as endpoints from "../../../api/endpoints";

vi.mock("../../../api/endpoints", async () => {
  const actual = await vi.importActual<typeof import("../../../api/endpoints")>(
    "../../../api/endpoints",
  );
  return {
    ...actual,
    validateContract: vi.fn(),
    discoverContract: vi.fn(),
    queryCorpus: vi.fn(),
  };
});

describe("ContractPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all three sub-tabs", () => {
    render(<ContractPanel />);
    expect(
      screen.getByRole("button", { name: "Validate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Discover" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corpus" })).toBeInTheDocument();
  });

  it("renders Discover sub-panel with corpus input when selected", async () => {
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Discover" }));
    expect(
      screen.getByText(/Black-box interface discovery/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("/path/to/mununu/corpus"),
    ).toBeInTheDocument();
  });

  it("passes the corpus path through to discoverContract when set", async () => {
    const mocked = vi.mocked(endpoints.discoverContract);
    mocked.mockResolvedValue({
      module: "AES_CTR_v1",
      labels: [],
      gaps: { markers: [] },
      corpus_resolutions: [],
    });
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Discover" }));
    fireEvent.change(screen.getByPlaceholderText("/path/to/mununu/corpus"), {
      target: { value: "/my/corpus" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run discovery/i }));
    await waitFor(() => {
      expect(mocked).toHaveBeenCalled();
    });
    const callArg = mocked.mock.calls[0]?.[0];
    expect(callArg?.corpus).toBe("/my/corpus");
  });

  it("omits the corpus field when the input is empty", async () => {
    const mocked = vi.mocked(endpoints.discoverContract);
    mocked.mockResolvedValue({
      module: "DDR_CTRL_V1",
      labels: [],
      gaps: { markers: [] },
    });
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Discover" }));
    fireEvent.click(screen.getByRole("button", { name: /Run discovery/i }));
    await waitFor(() => {
      expect(mocked).toHaveBeenCalled();
    });
    const callArg = mocked.mock.calls[0]?.[0];
    expect(callArg && "corpus" in callArg).toBe(false);
  });

  it("renders corpus resolutions when the response includes them", async () => {
    vi.mocked(endpoints.discoverContract).mockResolvedValue({
      module: "AES_CTR_v1",
      labels: [],
      gaps: { markers: [] },
      corpus_resolutions: [
        {
          raw_uri: "contract://rtl_crypto/aes_ctr@1.0.0?alt=strict_iv",
          parsed: {
            domain: "rtl_crypto",
            name: "aes_ctr",
            version: "1.0.0",
            alternative: "strict_iv",
            raw: "contract://rtl_crypto/aes_ctr@1.0.0?alt=strict_iv",
          },
          status: "resolved",
          matched_ids: ["rtl_crypto/aes_ctr@1.0.0"],
          alternative_matched: true,
        },
      ],
    });
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Discover" }));
    fireEvent.click(screen.getByRole("button", { name: /Run discovery/i }));
    await waitFor(() => {
      expect(screen.getByText(/corpus resolutions:/i)).toBeInTheDocument();
    });
    expect(screen.getByText("resolved")).toBeInTheDocument();
    expect(screen.getByText(/alt `strict_iv` ok/)).toBeInTheDocument();
  });

  it("Corpus tab calls queryCorpus with id + path + parsed parameters", async () => {
    const mocked = vi.mocked(endpoints.queryCorpus);
    mocked.mockResolvedValue({ candidates: [] });
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Corpus" }));
    fireEvent.click(screen.getByRole("button", { name: /Query corpus/i }));
    await waitFor(() => {
      expect(mocked).toHaveBeenCalledTimes(1);
    });
    expect(mocked.mock.calls[0]?.[0].id).toBe("rtl_crypto/aes_ctr");
    expect(mocked.mock.calls[0]?.[0].corpus).toBe("corpus");
    expect(mocked.mock.calls[0]?.[0].parameters).toEqual({});
  });

  it("Corpus tab renders ranked candidates with provenance + soundness badges", async () => {
    vi.mocked(endpoints.queryCorpus).mockResolvedValue({
      candidates: [
        {
          id: "rtl_crypto/aes_ctr",
          version: "1.0.0",
          domain: "rtl_crypto",
          name: "aes_ctr",
          description: "AES-CTR contract entry.",
          alternatives: [
            { id: "strict_iv", label: "Strict IV uniqueness" },
            { id: "permissive", label: "Permissive" },
          ],
          provenance: {
            tier: "mununu_verified",
            verified_against: "NIST SP 800-38A",
          },
          soundness_flag: "safety+liveness",
        },
      ],
    });
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Corpus" }));
    fireEvent.click(screen.getByRole("button", { name: /Query corpus/i }));
    await waitFor(() => {
      expect(screen.getByText(/1 candidate/i)).toBeInTheDocument();
    });
    expect(screen.getByText("rtl_crypto/aes_ctr @ 1.0.0")).toBeInTheDocument();
    expect(screen.getByText("mununu-verified")).toBeInTheDocument();
    expect(screen.getByText("safety+liveness")).toBeInTheDocument();
  });

  it("Corpus tab shows 'no matching entries' when candidates is empty", async () => {
    vi.mocked(endpoints.queryCorpus).mockResolvedValue({ candidates: [] });
    render(<ContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Corpus" }));
    fireEvent.click(screen.getByRole("button", { name: /Query corpus/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/No matching entries in the corpus/i),
      ).toBeInTheDocument();
    });
  });
});
