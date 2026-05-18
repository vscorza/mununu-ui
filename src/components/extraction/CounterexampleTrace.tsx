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

interface CounterexampleTraceProps {
  witness: VerifyTraceWitness;
}

export function CounterexampleTrace({ witness }: CounterexampleTraceProps) {
  const cycleAt =
    witness.termination.kind === "cycle"
      ? witness.termination.return_to_step
      : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
        <span className="font-medium">Counterexample (from</span>
        <span className="font-mono text-gray-900 dark:text-gray-100">
          {witness.initial_state}
        </span>
        <span className="font-medium">):</span>
      </div>
      {witness.steps.length === 0 ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          (no outgoing transitions — initial state itself violates the formula)
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
          {formatTermination(witness)}
        </div>
      )}
    </div>
  );
}

function formatTermination(w: VerifyTraceWitness): string {
  switch (w.termination.kind) {
    case "sink":
      return "terminated at a sink (no outgoing transitions)";
    case "cycle":
      return `cycle: re-enters step ${w.termination.return_to_step + 1}${
        w.termination.return_to_step === 0 ? " (initial state)" : ""
      }`;
    case "length_limit":
      return "trace truncated at the 20-step length cap";
  }
}
