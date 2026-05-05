import { describe, it, expect, beforeEach } from "vitest";
import { useExtractionStore } from "../extractionStore";
import { getWorkflow } from "../../types/workflow";

describe("extractionStore — compositional extraction state", () => {
  beforeEach(() => {
    useExtractionStore.getState().resetWorkflow();
  });

  it("initializes compositionConfig to null", () => {
    expect(useExtractionStore.getState().compositionConfig).toBeNull();
  });

  it("updateCompositionConfig stores the JSON string verbatim", () => {
    const json = JSON.stringify({
      type: "asynchronous",
      name: "race",
      instances: [
        { of: "Worker", as: "worker_a" },
        { of: "Worker", as: "worker_b" },
      ],
      shared: ["ev_save"],
    });
    useExtractionStore.getState().updateCompositionConfig(json);
    expect(useExtractionStore.getState().compositionConfig).toBe(json);
  });

  it("startWorkflow resets compositionConfig to null", () => {
    useExtractionStore.getState().updateCompositionConfig('{"x":1}');
    expect(useExtractionStore.getState().compositionConfig).not.toBeNull();
    const workflow = getWorkflow("software");
    if (!workflow) throw new Error("software workflow should exist");
    useExtractionStore.getState().startWorkflow(workflow, "src", "test.ts");
    expect(useExtractionStore.getState().compositionConfig).toBeNull();
  });

  it("resetWorkflow clears compositionConfig", () => {
    useExtractionStore.getState().updateCompositionConfig('{"x":1}');
    useExtractionStore.getState().resetWorkflow();
    expect(useExtractionStore.getState().compositionConfig).toBeNull();
  });

  it("software workflow includes the compose step after extract", () => {
    const workflow = getWorkflow("software");
    if (!workflow) throw new Error("software workflow should exist");
    const stepIds = workflow.steps.map((s) => s.id);
    const extractIdx = stepIds.indexOf("extract");
    const composeIdx = stepIds.indexOf("compose");
    expect(extractIdx).toBeGreaterThan(-1);
    expect(composeIdx).toBeGreaterThan(extractIdx);
    // The compose step is optional and requires extract.
    const composeStep = workflow.steps.find((s) => s.id === "compose");
    expect(composeStep?.optional).toBe(true);
    expect(composeStep?.requires).toContain("extract");
  });

  it("initializes extractConfig to null", () => {
    expect(useExtractionStore.getState().extractConfig).toBeNull();
  });

  it("updateExtractConfig stores the JSON string verbatim", () => {
    const json = JSON.stringify({
      $schema: "extraction_config_v1",
      source: { file: "x.ts" },
      targets: [{ class: "X", state_fields: ["_x"], methods: { include: ["m"] } }],
    });
    useExtractionStore.getState().updateExtractConfig(json);
    expect(useExtractionStore.getState().extractConfig).toBe(json);
  });

  it("startWorkflow resets extractConfig to null", () => {
    useExtractionStore.getState().updateExtractConfig('{"x":1}');
    expect(useExtractionStore.getState().extractConfig).not.toBeNull();
    const workflow = getWorkflow("software");
    if (!workflow) throw new Error("software workflow should exist");
    useExtractionStore.getState().startWorkflow(workflow, "src", "test.ts");
    expect(useExtractionStore.getState().extractConfig).toBeNull();
  });

  it("resetWorkflow clears extractConfig", () => {
    useExtractionStore.getState().updateExtractConfig('{"x":1}');
    useExtractionStore.getState().resetWorkflow();
    expect(useExtractionStore.getState().extractConfig).toBeNull();
  });
});
