import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiApiClient } from "../client";
import { runSvLint, type SvLintRequest, type SvLintResponse } from "../endpoints";

const mockResponse: SvLintResponse = {
  signals_flagged: 2,
  registers_flagged: 1,
  findings: [
    { signal: "a_q", kind: "register" },
    { signal: "o_partsel", kind: "output" },
  ],
};

describe("runSvLint (POST /sv/lint)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the SV lift fields and returns the typed partial-write findings", async () => {
    const postSpy = vi.spyOn(aiApiClient, "post").mockResolvedValue({
      data: mockResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as unknown,
    });

    const req: SvLintRequest = {
      source: "module m; endmodule",
      use_slang: true,
    };
    const out = await runSvLint(req);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = postSpy.mock.calls[0];
    expect(endpoint).toBe("/sv/lint");
    expect((payload as SvLintRequest).use_slang).toBe(true);

    expect(out.signals_flagged).toBe(2);
    expect(out.registers_flagged).toBe(1);
    // The root finding is the register whose partial-write lift is unfaithful.
    const reg = out.findings.find((f) => f.kind === "register");
    expect(reg?.signal).toBe("a_q");
  });
});
