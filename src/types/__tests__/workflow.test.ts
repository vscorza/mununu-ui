import { describe, it, expect } from "vitest";
import { WORKFLOW_REGISTRY, availableDomains, getWorkflow } from "../workflow";

describe("workflow registry", () => {
  it("exposes the established domains", () => {
    const domains = availableDomains();
    expect(domains).toContain("rtl");
    expect(domains).toContain("software");
    expect(domains).toContain("xstate");
  });

  it("registers the agentic domains (crewai + langgraph)", () => {
    const domains = availableDomains();
    expect(domains).toContain("crewai");
    expect(domains).toContain("langgraph");
  });

  it("registers the verify-project workflow", () => {
    expect(availableDomains()).toContain("verify-project");
  });

  it("crewai workflow advertises .crewai.json extension", () => {
    const wf = getWorkflow("crewai");
    expect(wf).toBeDefined();
    expect(wf?.sourceExtensions).toContain(".crewai.json");
    // 3-step shape (load -> translate -> verify).
    expect(wf?.steps.map((s) => s.id)).toEqual(["load", "translate", "verify"]);
  });

  it("langgraph workflow advertises .langgraph.json extension", () => {
    const wf = getWorkflow("langgraph");
    expect(wf).toBeDefined();
    expect(wf?.sourceExtensions).toContain(".langgraph.json");
    expect(wf?.steps.map((s) => s.id)).toEqual(["load", "translate", "verify"]);
  });

  it("verify-project workflow routes its verify step to /verify", () => {
    const wf = getWorkflow("verify-project");
    expect(wf).toBeDefined();
    const verifyStep = wf?.steps.find((s) => s.id === "verify");
    expect(verifyStep?.endpoint).toBe("/verify");
    expect(verifyStep?.timeout).toBe("extended");
  });

  it("rtl workflow offers an optional SV-direct CEGAR step over /sv/cegar", () => {
    const wf = getWorkflow("rtl");
    expect(wf).toBeDefined();
    const cegarStep = wf?.steps.find((s) => s.id === "cegar");
    expect(cegarStep, "rtl workflow must have a cegar step").toBeDefined();
    expect(cegarStep?.endpoint).toBe("/sv/cegar");
    expect(cegarStep?.optional).toBe(true);
    expect(cegarStep?.requires).toEqual(["load"]);
    expect(cegarStep?.timeout).toBe("extended");
  });

  it("registers the btor2 + CEGAR workflow (load -> cegar over /btor2/cegar)", () => {
    const wf = getWorkflow("btor2");
    expect(wf).toBeDefined();
    expect(wf?.sourceExtensions).toContain(".btor2");
    expect(wf?.steps.map((s) => s.id)).toEqual(["load", "cegar"]);
    const cegarStep = wf?.steps.find((s) => s.id === "cegar");
    expect(cegarStep?.endpoint).toBe("/btor2/cegar");
    expect(cegarStep?.requires).toEqual(["load"]);
    expect(cegarStep?.timeout).toBe("extended");
  });

  it("getWorkflow returns undefined for unknown domains", () => {
    expect(getWorkflow("nonexistent")).toBeUndefined();
  });

  it("no longer registers the deprecated gameengine (Godot) workflow", () => {
    expect(availableDomains()).not.toContain("gameengine");
    expect(getWorkflow("gameengine")).toBeUndefined();
  });

  it("every workflow's step ids are unique within the workflow", () => {
    for (const [domain, wf] of Object.entries(WORKFLOW_REGISTRY)) {
      const ids = wf.steps.map((s) => s.id);
      const unique = new Set(ids);
      expect(unique.size, `${domain} has duplicate step ids`).toBe(ids.length);
    }
  });
});
