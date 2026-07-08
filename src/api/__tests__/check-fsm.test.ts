import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiApiClient } from "../client";
import {
  runBtor2CheckFsm,
  type Btor2CheckFsmRequest,
  type Btor2CheckFsmResponse,
} from "../endpoints";

const mockResponse: Btor2CheckFsmResponse = {
  fsm_registers_checked: 2,
  traps_found: 1,
  registers: [
    {
      register: "state_q",
      idle_value: 55,
      verdict: "holds",
      unrecoverable_trap: false,
    },
    {
      register: "sub_sm",
      idle_value: 0,
      verdict: "violated",
      unrecoverable_trap: true,
    },
  ],
};

describe("runBtor2CheckFsm (POST /btor2/check-fsm)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the BTOR2 content and returns the typed per-register findings", async () => {
    const postSpy = vi.spyOn(aiApiClient, "post").mockResolvedValue({
      data: mockResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as unknown,
    });

    const req: Btor2CheckFsmRequest = {
      content: "1 sort bitvec 1\n2 state 1 st\n",
      max_width: 8,
    };
    const out = await runBtor2CheckFsm(req);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = postSpy.mock.calls[0];
    expect(endpoint).toBe("/btor2/check-fsm");
    expect((payload as Btor2CheckFsmRequest).max_width).toBe(8);

    expect(out.fsm_registers_checked).toBe(2);
    expect(out.traps_found).toBe(1);
    // The trap is the register whose verdict is "violated".
    const trap = out.registers.find((r) => r.unrecoverable_trap);
    expect(trap?.register).toBe("sub_sm");
    expect(trap?.verdict).toBe("violated");
  });
});
