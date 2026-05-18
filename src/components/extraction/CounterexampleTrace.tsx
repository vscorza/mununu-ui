/**
 * CounterexampleTrace — renders a `VerifyTraceWitness` as a vertical
 * stepped walk: initial composed state → labelled transitions →
 * terminator (sink / cycle / length-limit).
 *
 * Pairs with the backend witness emitted in mununu#64 (A3). The
 * component is presentational: it does not fetch or transform the
 * witness, it just lays out one row per step.
 *
 * Multi-label transitions (CTXDSL `transition s -> t on label a,
 * label b;`) arrive as a single comma-joined `label` string. The
 * renderer splits on `,` so each label gets its own chip.
 */

import type { VerifyTraceWitness } from "../../api/endpoints";
import { useI18n } from "../../hooks/useI18n";

interface CounterexampleTraceProps {
  witness: VerifyTraceWitness;
}

export function CounterexampleTrace({ witness }: CounterexampleTraceProps) {
  const { t } = useI18n();
  const cycleAt =
    witness.termination.kind === "cycle"
      ? witness.termination.return_to_step
      : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
        <span className="font-medium">{t("extraction.counterexample.heading")}</span>
        <span className="font-mono text-gray-900 dark:text-gray-100">
          {witness.initial_state}
        </span>
        <span className="font-medium">{t("extraction.counterexample.headingTail")}</span>
      </div>
      {witness.steps.length === 0 ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t("extraction.counterexample.noOutgoing")}
        </div>
      ) : (
        <ol className="space-y-1">
          {witness.steps.map((step, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2 text-xs ${
                cycleAt === idx
                  ? "rounded bg-amber-50 px-2 py-1 dark:bg-amber-900/20"
                  : ""
              }`}
            >
              <span className="select-none font-mono text-gray-400 dark:text-gray-500">
                {idx + 1}.
              </span>
              <span className="flex flex-wrap items-center gap-1">
                <span className="text-gray-400 dark:text-gray-500">—[</span>
                {step.label.split(",").map((lab) => (
                  <span
                    key={lab}
                    className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {lab.trim()}
                  </span>
                ))}
                <span className="text-gray-400 dark:text-gray-500">]→</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">
                  {step.successor_state}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
      {witness.steps.length > 0 && (
        <div className="text-xs italic text-gray-600 dark:text-gray-400">
          {formatTermination(witness, t)}
        </div>
      )}
    </div>
  );
}

function formatTermination(
  w: VerifyTraceWitness,
  t: (path: string, vars?: Record<string, string | number>) => string,
): string {
  switch (w.termination.kind) {
    case "sink":
      return t("extraction.counterexample.terminatorSink");
    case "cycle": {
      const step = w.termination.return_to_step + 1;
      return w.termination.return_to_step === 0
        ? t("extraction.counterexample.terminatorCycleInitial", { step })
        : t("extraction.counterexample.terminatorCycle", { step });
    }
    case "length_limit":
      return t("extraction.counterexample.terminatorLengthLimit");
  }
}
