/**
 * VerdictTable — renders the property verdicts from a verify-framework
 * `VerifyReport`. Used by the `verify-project` workflow's verify step.
 *
 * Stays intentionally minimal: one row per property, with verdict,
 * over-target, formula source kind, and a state-count summary
 * (`satisfying / total`). The full formula text is shown collapsed
 * and revealed via a per-row toggle since some inline formulas can
 * span multiple lines.
 */

import { useState } from "react";
import type { VerifyReport, VerifyPropertyVerdict } from "../../api/endpoints";

interface VerdictTableProps {
  report: VerifyReport;
}

export function VerdictTable({ report }: VerdictTableProps) {
  return (
    <div className="space-y-4">
      <Header report={report} />
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Property
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Verdict
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Over
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Source
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              States
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {report.property_verdicts.map((v) => (
            <VerdictRow key={v.name} verdict={v} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Header({ report }: { report: VerifyReport }) {
  const satisfied = report.property_verdicts.filter((v) => v.satisfied).length;
  const total = report.property_verdicts.length;
  return (
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {report.project}
      </h4>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span>
          <span className="font-medium">{satisfied}</span> /{" "}
          <span className="font-medium">{total}</span> properties satisfied
        </span>
        <span>·</span>
        <span>
          composition:{" "}
          <span className="font-mono">{report.composition.semantics}</span>{" "}
          <span className="font-mono">{report.composition.name}</span>
        </span>
        <span>·</span>
        <span>
          members:{" "}
          <span className="font-mono">
            {report.composition.members.join(", ")}
          </span>
        </span>
      </div>
    </div>
  );
}

function VerdictRow({ verdict }: { verdict: VerifyPropertyVerdict }) {
  const [expanded, setExpanded] = useState(false);
  const verdictClass = verdict.satisfied
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  const sourceLabel =
    verdict.formula_source.kind === "template"
      ? `template:${verdict.formula_source.id}`
      : "inline";

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
          <span className="font-mono">{verdict.name}</span>
        </td>
        <td className="px-3 py-2 text-xs">
          <span
            className={`inline-block rounded-full px-2 py-0.5 font-medium ${verdictClass}`}
          >
            {verdict.satisfied ? "SATISFIED" : "VIOLATED"}
          </span>
        </td>
        <td className="px-3 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">
          {verdict.over}
        </td>
        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
          {sourceLabel}
        </td>
        <td className="px-3 py-2 text-right text-xs font-mono text-gray-600 dark:text-gray-400">
          {verdict.satisfying_states} / {verdict.total_states}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 dark:bg-gray-800/30">
          <td colSpan={5} className="px-3 py-3 text-xs">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Formula:
                </span>
                <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-gray-600 dark:text-gray-400">
                  {verdict.formula}
                </pre>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Initial states:
                </span>{" "}
                <span className="font-mono">
                  {verdict.initial_satisfying.length} satisfying /{" "}
                  {verdict.initial_states.length} total
                </span>
                {verdict.initial_states.length > 0 && (
                  <span className="ml-2 font-mono">
                    [{verdict.initial_states.join(", ")}]
                  </span>
                )}
              </div>
              {verdict.formula_source.kind === "template" &&
                Object.keys(verdict.formula_source.args).length > 0 && (
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Template args:
                    </span>{" "}
                    <span className="font-mono">
                      {Object.entries(verdict.formula_source.args)
                        .map(([k, val]) => `${k} = ${val}`)
                        .join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
