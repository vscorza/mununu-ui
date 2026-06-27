/**
 * SvExtractSvaRunner — the Track-H SVA front-end in the extraction tab (XL.6a).
 *
 * Reads the loaded SystemVerilog (+ any additional sources) from the extraction
 * store and posts to `POST /api/v1/sv/extract-sva` — the backend runs the slang
 * parser, finds every `assert` / `assume` / `cover property`, and translates the
 * supported Tier-1/Tier-2 fragment to mu-calculus formulas (emitting each
 * cover's `AG EF` recoverability companion and the `$past` shadow registers the
 * formulas need). Anything outside the fragment is reported unsupported, never
 * silently dropped. No model verification (that is the CEGAR step / verify-auto)
 * — this surfaces the formulas you can then feed into the CEGAR form.
 *
 * Surface peer of the CLI `mununu sv extract-sva`.
 */

import { useState } from "react";
import { Button } from "../common/Button";
import {
  runSvExtractSva,
  SvExtractSvaResponse,
} from "../../api/endpoints";
import { useExtractionStore } from "../../store/extractionStore";

export const SvExtractSvaRunner = () => {
  const { sourceContent, sourceFileName, additionalSources } =
    useExtractionStore();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SvExtractSvaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setError(null);
    setResult(null);
    if (!sourceContent.trim()) {
      setError("No SystemVerilog source loaded — complete the Load step first.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await runSvExtractSva({
        source: sourceContent,
        additional_sources: additionalSources.map((s) => ({
          name: s.name,
          content: s.content,
        })),
      });
      setResult(response);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unknown error from /api/v1/sv/extract-sva",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p style={{ color: "var(--text-secondary, #666)" }}>
        Extracts the design's SystemVerilog Assertions and translates the
        supported fragment to mu-calculus via the <code>slang</code> front-end —
        including each <code>cover</code>'s <code>AG EF</code> recoverability
        companion. No verification; use a translated formula in the CEGAR step.
        Surface peer of the CLI <code>mununu sv extract-sva</code> and{" "}
        <code>POST /api/v1/sv/extract-sva</code>.
      </p>

      <section style={{ marginTop: "1rem" }}>
        <strong>SystemVerilog source:</strong>{" "}
        {sourceFileName ? (
          <code>{sourceFileName}</code>
        ) : (
          <span style={{ color: "var(--error-text, #c00)" }}>
            none loaded — complete the Load step
          </span>
        )}
        {additionalSources.length > 0 && (
          <span style={{ color: "var(--text-secondary, #666)" }}>
            {" "}
            (+{additionalSources.length} additional source
            {additionalSources.length !== 1 ? "s" : ""})
          </span>
        )}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleExtract}
          isLoading={isLoading}
        >
          Extract SVA
        </Button>
      </section>

      {error && (
        <section
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "var(--error-bg, #fee)",
            color: "var(--error-text, #c00)",
            border: "1px solid var(--error-border, #f00)",
            borderRadius: "4px",
          }}
        >
          <strong>Error:</strong> {error}
        </section>
      )}

      {result && (
        <section style={{ marginTop: "1.5rem" }}>
          <p>
            <strong>
              {result.translated.length} translated, {result.unsupported.length}{" "}
              unsupported
            </strong>{" "}
            (of {result.translated.length + result.unsupported.length} concurrent
            assertions)
          </p>

          {result.translated.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <h4>Translated</h4>
              <ul style={{ fontSize: "0.85rem" }}>
                {result.translated.map((t) => (
                  <li key={t.name} style={{ marginBottom: "0.4rem" }}>
                    <code>[{t.kind}]</code> <strong>{t.name}</strong>:{" "}
                    <code>{t.formula}</code>
                    {t.recoverability_companion && (
                      <div
                        style={{
                          color: "var(--text-secondary, #666)",
                          marginLeft: "1rem",
                        }}
                      >
                        recoverability (AG EF):{" "}
                        <code>{t.recoverability_companion}</code>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.unsupported.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <h4>Unsupported (reported, never dropped)</h4>
              <ul style={{ fontSize: "0.85rem" }}>
                {result.unsupported.map((u) => (
                  <li key={u.name}>
                    <code>[{u.kind ?? "?"}]</code> <strong>{u.name}</strong>:{" "}
                    {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.required_shadows.length > 0 && (
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
              <strong>Required <code>__past</code> shadow registers:</strong>{" "}
              {result.required_shadows
                .map((s) => `${s.base}(${s.width})`)
                .join(", ")}
            </p>
          )}
        </section>
      )}
    </div>
  );
};
