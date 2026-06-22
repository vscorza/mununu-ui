import { Button } from "./Button";
import { downloadAsFile } from "../../api/endpoints";

interface DownloadJsonButtonProps {
  /** The value serialized (pretty-printed) and downloaded. */
  data: unknown;
  /** Download filename — should end in `.json`. */
  filename: string;
  /** Button label. Defaults to "Download JSON". */
  label?: string;
}

/**
 * CTXDSL Phase 4 (2026-06-22) — opt-in JSON export for diagnostic artifacts
 * (the counterstrategy graph + lasso / counterexample / deadlock traces).
 *
 * A counterstrategy is a strategy graph over the model-checking product and a
 * countertrace is a lasso (prefix + cycle) — neither is naturally re-loadable
 * CTXDSL, so JSON is the stable carrier (the same shape the CLI's
 * `--dump-json` and the API synthesize/verify responses already serialize).
 * The CLI + API already expose these as serialized output; this closes the
 * UI gap (the viewers rendered but offered no download).
 */
export const DownloadJsonButton = ({
  data,
  filename,
  label = "Download JSON",
}: DownloadJsonButtonProps) => (
  <Button
    variant="secondary"
    size="sm"
    onClick={() =>
      downloadAsFile(
        JSON.stringify(data, null, 2),
        filename,
        "application/json",
      )
    }
  >
    {label}
  </Button>
);
