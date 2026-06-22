/**
 * Shared input parsing for the CEGAR runners (BTOR2-direct `CegarRunner`
 * and SV-direct `SvCegarRunner`). Both surfaces parse the predicate rows
 * and the one-per-line option lists identically, so the parsing lives in
 * one place (no drift between the two forms).
 */

import type { PredicateSpecRequest } from "../../api/endpoints";

/**
 * Parse the initial-predicates textarea: one `name, register, value` row
 * per line. Blank lines and `//` comment lines are skipped. Throws on a
 * malformed row (wrong arity or a non-finite value).
 */
export function parsePredicates(text: string): PredicateSpecRequest[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"))
    .map((line) => {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length !== 3) {
        throw new Error(
          `Invalid predicate row: ${line}. Expected "name, register, value".`,
        );
      }
      const value = Number(parts[2]);
      if (!Number.isFinite(value)) {
        throw new Error(
          `Invalid predicate value: ${parts[2]} (must be a finite integer).`,
        );
      }
      return { name: parts[0], register: parts[1], value };
    });
}

/**
 * Parse a one-per-line textarea (controllable inputs, config values) into
 * a trimmed list, skipping blank and `//` comment lines.
 */
export function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));
}
