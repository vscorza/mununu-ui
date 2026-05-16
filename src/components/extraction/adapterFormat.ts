/**
 * Adapter-format resolution from workflow domain.
 *
 * Kept in a non-component module so React Fast Refresh doesn't complain
 * about mixed exports (the ExtractionPanel re-exports this helper for
 * call sites that need it).
 */

/**
 * Resolve the adapter format to send to `/context/import` from the
 * active workflow's domain.
 *
 * Keep in sync with `WORKFLOW_REGISTRY` and the backend's
 * `ADAPTER_FORMATS` list.
 *
 * - `rtl` -> `systemverilog`
 * - `software` -> `extraction`
 * - `crewai` -> `crewai`
 * - `langgraph` -> `langgraph`
 * - anything else (`xstate`, `gameengine`, …) -> `auto` (content-sniff)
 */
export function resolveAdapterFormat(
  domain: string | undefined,
): "systemverilog" | "extraction" | "crewai" | "langgraph" | "auto" {
  switch (domain) {
    case "rtl":
      return "systemverilog";
    case "software":
      return "extraction";
    case "crewai":
      return "crewai";
    case "langgraph":
      return "langgraph";
    default:
      return "auto";
  }
}
