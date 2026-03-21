import { useState } from "react";
import { TraceViewer } from "./TraceViewer";
import type { components } from "../../api/types";
import "./DiagnosticsView.css";

type SynthesisDiagnostics = components["schemas"]["SynthesisDiagnostics"];
type ProofObligation = components["schemas"]["ProofObligation"];

interface DiagnosticsPanelProps {
  diagnostics: SynthesisDiagnostics;
  realizable: boolean;
}

export const DiagnosticsPanel = ({
  diagnostics,
  realizable,
}: DiagnosticsPanelProps) => {
  const [counterexampleStep, setCounterexampleStep] = useState(0);
  const [strategyTraceIndex, setStrategyTraceIndex] = useState(0);
  const [strategyStep, setStrategyStep] = useState(0);
  const [deadlockTraceIndex, setDeadlockTraceIndex] = useState(0);
  const [deadlockStep, setDeadlockStep] = useState(0);
  const [expandedObligations, setExpandedObligations] = useState<Set<number>>(
    new Set(),
  );

  const toggleObligation = (index: number) => {
    setExpandedObligations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const hasMessages =
    diagnostics.messages && diagnostics.messages.length > 0;
  const hasViolatingInitials =
    diagnostics.violating_initials &&
    diagnostics.violating_initials.length > 0;
  const hasCounterexample =
    diagnostics.counterexample_trace &&
    diagnostics.counterexample_trace.length > 0;
  const hasCounterstrategies =
    diagnostics.counterstrategy_traces &&
    diagnostics.counterstrategy_traces.length > 0;
  const hasDeadlockTraces =
    diagnostics.deadlock_traces && diagnostics.deadlock_traces.length > 0;
  const hasProofObligations =
    diagnostics.proof_obligations &&
    diagnostics.proof_obligations.length > 0;

  return (
    <div className="diagnostics-view">
      <div
        className={`diagnostics-view__status ${realizable ? "diagnostics-view__status--realizable" : "diagnostics-view__status--unrealizable"}`}
      >
        {realizable ? "Realizable" : "Unrealizable"}
      </div>

      {hasMessages && (
        <div className="diagnostics-view__messages">
          {diagnostics.messages!.map((msg, i) => (
            <div key={i} className="diagnostics-view__message">
              {msg}
            </div>
          ))}
        </div>
      )}

      {hasViolatingInitials && (
        <div className="diagnostics-view__violating-initials">
          <h4>Violating Initial States</h4>
          <div className="diagnostics-view__state-list">
            {diagnostics.violating_initials!.map((state, i) => (
              <span key={i} className="diagnostics-view__state-badge">
                {state}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasCounterexample && (
        <TraceViewer
          traces={[diagnostics.counterexample_trace!]}
          title="Counterexample Trace"
          selectedTraceIndex={0}
          selectedStep={counterexampleStep}
          onTraceSelect={() => {}}
          onStepSelect={setCounterexampleStep}
        />
      )}

      {hasCounterstrategies && (
        <TraceViewer
          traces={diagnostics.counterstrategy_traces!}
          title="Counterstrategy Traces"
          selectedTraceIndex={strategyTraceIndex}
          selectedStep={strategyStep}
          onTraceSelect={(idx) => {
            setStrategyTraceIndex(idx);
            setStrategyStep(0);
          }}
          onStepSelect={setStrategyStep}
        />
      )}

      {hasDeadlockTraces && (
        <TraceViewer
          traces={diagnostics.deadlock_traces!}
          title="Deadlock Traces"
          selectedTraceIndex={deadlockTraceIndex}
          selectedStep={deadlockStep}
          onTraceSelect={(idx) => {
            setDeadlockTraceIndex(idx);
            setDeadlockStep(0);
          }}
          onStepSelect={setDeadlockStep}
        />
      )}

      {hasProofObligations && (
        <div className="diagnostics-view__proof-obligations">
          <h4>Proof Obligations</h4>
          {diagnostics.proof_obligations!.map(
            (po: ProofObligation, i: number) => (
              <div
                key={i}
                className={`diagnostics-view__obligation ${expandedObligations.has(i) ? "diagnostics-view__obligation--expanded" : ""}`}
                onClick={() => toggleObligation(i)}
              >
                <div className="diagnostics-view__obligation-header">
                  <span className="diagnostics-view__obligation-state">
                    {po.state}
                  </span>
                  <span className="diagnostics-view__obligation-toggle">
                    {expandedObligations.has(i) ? "▼" : "▶"}
                  </span>
                </div>
                {expandedObligations.has(i) && po.detail && (
                  <div className="diagnostics-view__obligation-detail">
                    {po.detail}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};
