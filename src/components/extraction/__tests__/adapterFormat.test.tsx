import { describe, it, expect } from "vitest";
import { resolveAdapterFormat } from "../adapterFormat";

describe("resolveAdapterFormat", () => {
  it.each([
    ["rtl", "systemverilog"],
    ["software", "extraction"],
    ["crewai", "crewai"],
    ["langgraph", "langgraph"],
    ["xstate", "auto"],
    ["gameengine", "auto"],
    ["verify-project", "auto"],
    [undefined, "auto"],
    ["nonsense", "auto"],
  ] as const)("maps domain %s to %s", (domain, expected) => {
    expect(resolveAdapterFormat(domain)).toBe(expected);
  });
});
