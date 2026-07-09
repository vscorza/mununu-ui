import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiApiClient } from "../client";
import {
  synthesizeGr1,
  type Gr1SynthesizeRequest,
  type Gr1SynthesizeResponse,
} from "../endpoints";

const mockResponse: Gr1SynthesizeResponse = {
  realizable: true,
  controller_sv:
    "module gr1_controller (input logic clk, input logic req, output logic grant);\nendmodule",
  game_states: 13,
  monitor_bits: 2,
  notes: [],
};

describe("synthesizeGr1 (POST /synth/gr1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the spec and returns the sound GR(1) verdict + controller SV", async () => {
    const postSpy = vi.spyOn(aiApiClient, "post").mockResolvedValue({
      data: mockResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as unknown,
    });

    const req: Gr1SynthesizeRequest = {
      context: {
        name: "rg.tlsf",
        content:
          "MAIN { INPUTS { req; } OUTPUTS { grant; } " +
          "ASSUMPTIONS { G F req; } GUARANTEES { G (req -> F grant); } }",
      },
    };
    const out = await synthesizeGr1(req);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [endpoint] = postSpy.mock.calls[0];
    expect(endpoint).toBe("/synth/gr1");
    expect(out.realizable).toBe(true);
    expect(out.monitor_bits).toBe(2);
    expect(out.controller_sv).toContain("module gr1_controller");
  });

  it("surfaces an unrealizable verdict with no controller", async () => {
    vi.spyOn(aiApiClient, "post").mockResolvedValue({
      data: {
        realizable: false,
        game_states: 13,
        monitor_bits: 2,
        notes: [],
      } as Gr1SynthesizeResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as unknown,
    });

    const out = await synthesizeGr1({
      context: {
        name: "u.tlsf",
        content: "MAIN { INPUTS { req; } OUTPUTS { grant; } }",
      },
    });
    expect(out.realizable).toBe(false);
    expect(out.controller_sv).toBeUndefined();
  });
});
