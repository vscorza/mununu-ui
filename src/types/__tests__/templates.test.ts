import { describe, it, expect } from "vitest";
import {
  instantiateTemplate,
  type PropertyTemplate,
  type TemplateDomain,
} from "../templates";

const makeTemplate = (
  overrides: Partial<PropertyTemplate> = {},
): PropertyTemplate => ({
  id: "test",
  display_name: "Test",
  description: "A test template",
  kind: "safety",
  role: "standalone",
  domains: ["universal"] as TemplateDomain[],
  params: [],
  formula_pattern: "nu X. ([] X)",
  domain_hints: {},
  tags: [],
  ...overrides,
});

describe("instantiateTemplate", () => {
  it("returns formula unchanged for zero-param templates", () => {
    const tmpl = makeTemplate({
      formula_pattern: "nu X. (<> true && [] X)",
    });
    expect(instantiateTemplate(tmpl, {})).toBe("nu X. (<> true && [] X)");
  });

  it("substitutes a single parameter", () => {
    const tmpl = makeTemplate({
      params: [
        {
          name: "TARGET",
          description: "target",
          param_type: { type: "predicate" },
          required: true,
        },
      ],
      formula_pattern: "mu X. (${TARGET} || <> X)",
    });
    const result = instantiateTemplate(tmpl, { TARGET: "Idle" });
    expect(result).toBe("mu X. (Idle || <> X)");
    expect(result).not.toContain("${");
  });

  it("substitutes multiple parameters", () => {
    const tmpl = makeTemplate({
      params: [
        {
          name: "A",
          description: "first",
          param_type: { type: "predicate" },
          required: true,
        },
        {
          name: "B",
          description: "second",
          param_type: { type: "predicate" },
          required: true,
        },
      ],
      formula_pattern: "nu X. (!(${A} && ${B}) && [] X)",
    });
    const result = instantiateTemplate(tmpl, { A: "P1", B: "P2" });
    expect(result).toBe("nu X. (!(P1 && P2) && [] X)");
  });

  it("uses default value when arg not provided", () => {
    const tmpl = makeTemplate({
      params: [
        {
          name: "OVERFLOW",
          description: "overflow",
          param_type: { type: "predicate" },
          required: true,
        },
        {
          name: "UNDERFLOW",
          description: "underflow",
          param_type: { type: "predicate" },
          default: "false",
          required: false,
        },
      ],
      formula_pattern: "nu X. (!${OVERFLOW} && !${UNDERFLOW} && [] X)",
    });
    const result = instantiateTemplate(tmpl, { OVERFLOW: "max_hp" });
    expect(result).toBe("nu X. (!max_hp && !false && [] X)");
  });

  it("substitutes empty string when required param missing and no default", () => {
    const tmpl = makeTemplate({
      params: [
        {
          name: "TARGET",
          description: "target",
          param_type: { type: "predicate" },
          required: true,
        },
      ],
      formula_pattern: "mu X. (${TARGET} || <> X)",
    });
    // Client-side preview uses empty string for missing params;
    // server-side validation rejects missing required params.
    const result = instantiateTemplate(tmpl, {});
    expect(result).toBe("mu X. ( || <> X)");
    expect(result).not.toContain("${");
  });
});
