/**
 * TypeScript types for the cross-domain property template system.
 *
 * These types mirror the Rust types in `crates/mununu-core/src/adapter/templates/mod.rs`
 * and the JSON catalog in `builtin_templates.json`. The API endpoint
 * `GET /api/v1/templates` returns a `TemplateCatalog`.
 */

export type TemplateDomain =
  | "game"
  | "rtl"
  | "agentic"
  | "software"
  | "synthesis"
  | "universal";

export type ParamType =
  | { type: "predicate" }
  | { type: "state" }
  | { type: "integer"; min?: number; max?: number }
  | { type: "label" }
  | { type: "expression" };

export interface TemplateParam {
  name: string;
  description: string;
  param_type: ParamType;
  default?: string;
  required: boolean;
}

export interface PropertyTemplate {
  id: string;
  display_name: string;
  description: string;
  kind: string;
  role: string;
  domains: TemplateDomain[];
  params: TemplateParam[];
  formula_pattern: string;
  domain_hints: Record<string, Record<string, string>>;
  tags: string[];
}

export interface TemplateRef {
  template: string;
  args: Record<string, string>;
}

export interface TemplateCatalog {
  version: string;
  templates: PropertyTemplate[];
}

/**
 * Instantiate a template client-side by substituting `${PARAM}` placeholders.
 * This is for preview only; the authoritative instantiation happens server-side.
 */
export function instantiateTemplate(
  template: PropertyTemplate,
  args: Record<string, string>,
): string {
  let formula = template.formula_pattern;
  for (const param of template.params) {
    const value = args[param.name] ?? param.default ?? "";
    formula = formula.split(`\${${param.name}}`).join(value);
  }
  return formula;
}
