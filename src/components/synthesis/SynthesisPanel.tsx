import { useState } from "react";
import { useSynthesis } from "../../hooks/useSynthesis";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { TraceViewer } from "../visualization/TraceViewer";
import { LassoTraceViewer } from "../visualization/LassoTraceViewer";

interface SynthesisPanelProps {
  content: string;
}

export const SynthesisPanel = ({ content }: SynthesisPanelProps) => {
  const { state, synthesize, clearResult } = useSynthesis();

  const [formula, setFormula] = useState("");
  const [automaton, setAutomaton] = useState("");
  const [minimize, setMinimize] = useState(false);
  const [extractStrategy, setExtractStrategy] = useState(false);
  const [counterexample, setCounterexample] = useState(false);
  const [deadlockTraces, setDeadlockTraces] = useState(false);

  // Trace viewer state for counterstrategy traces
  const [csTraceIndex, setCsTraceIndex] = useState(0);
  const [csStep, setCsStep] = useState(0);

  const handleSynthesize = () => {
    synthesize(content, formula, automaton, {
      minimize,
      counterexample,
      deadlockTraces,
      counterstrategy: extractStrategy,
    });
  };

  const result = state.result;
  const diagnostics = result?.diagnostics;

  return (
    <div className="synthesis-panel">
      <div className="synthesis-panel__controls">
        <div className="synthesis-panel__inputs">
          <Input
            label="Formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="Formula name"
          />
          <Input
            label="Automaton"
            value={automaton}
            onChange={(e) => setAutomaton(e.target.value)}
            placeholder="Automaton name"
          />
        </div>

        <div className="synthesis-panel__options">
          <label className="synthesis-panel__checkbox">
            <input
              type="checkbox"
              checked={minimize}
              onChange={(e) => setMinimize(e.target.checked)}
            />
            Minimize
          </label>
          <label className="synthesis-panel__checkbox">
            <input
              type="checkbox"
              checked={extractStrategy}
              onChange={(e) => setExtractStrategy(e.target.checked)}
            />
            Extract Strategy
          </label>
          <label className="synthesis-panel__checkbox">
            <input
              type="checkbox"
              checked={counterexample}
              onChange={(e) => setCounterexample(e.target.checked)}
            />
            Counterexample
          </label>
          <label className="synthesis-panel__checkbox">
            <input
              type="checkbox"
              checked={deadlockTraces}
              onChange={(e) => setDeadlockTraces(e.target.checked)}
            />
            Deadlock Traces
          </label>
        </div>

        <div className="synthesis-panel__actions">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSynthesize}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <>
                <LoadingSpinner size="sm" /> Synthesizing...
              </>
            ) : (
              "Synthesize"
            )}
          </Button>
          {result && (
            <Button variant="ghost" size="sm" onClick={clearResult}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {state.error && (
        <div className="synthesis-panel__error">{state.error}</div>
      )}

      {result && (
        <div className="synthesis-panel__results">
          <div
            className={`synthesis-panel__badge ${
              result.realizable
                ? "synthesis-panel__badge--realizable"
                : "synthesis-panel__badge--unrealizable"
            }`}
          >
            {result.realizable ? "Realizable" : "Unrealizable"}
          </div>

          {result.realizable && result.controller && (
            <div className="synthesis-panel__controller">
              <h4 className="synthesis-panel__section-title">Controller</h4>
              <pre className="synthesis-panel__code">
                {result.controller.content}
              </pre>
            </div>
          )}

          {diagnostics && (
            <div className="synthesis-panel__diagnostics">
              <h4 className="synthesis-panel__section-title">Diagnostics</h4>

              {diagnostics.messages && diagnostics.messages.length > 0 && (
                <div className="synthesis-panel__messages">
                  <h5>Messages</h5>
                  <ul>
                    {diagnostics.messages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnostics.violating_initials &&
                diagnostics.violating_initials.length > 0 && (
                  <div className="synthesis-panel__violating">
                    <h5>Violating Initial States</h5>
                    <ul>
                      {diagnostics.violating_initials.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {diagnostics.deadlock_traces &&
                diagnostics.deadlock_traces.length > 0 && (
                  <div className="synthesis-panel__deadlocks">
                    <TraceViewer
                      traces={diagnostics.deadlock_traces}
                      title="Deadlock Traces"
                      selectedTraceIndex={0}
                      selectedStep={0}
                      onTraceSelect={() => {}}
                      onStepSelect={() => {}}
                    />
                  </div>
                )}

              {diagnostics.counterexample_trace &&
                diagnostics.counterexample_trace.length > 0 && (
                  <div className="synthesis-panel__lasso">
                    <LassoTraceViewer
                      traces={[
                        {
                          prefix: diagnostics.counterexample_trace,
                          cycle: [],
                        },
                      ]}
                      title="Lasso Traces"
                    />
                  </div>
                )}

              {diagnostics.counterstrategy_traces &&
                diagnostics.counterstrategy_traces.length > 0 && (
                  <div className="synthesis-panel__counterstrategy">
                    <TraceViewer
                      traces={diagnostics.counterstrategy_traces}
                      title="Counterstrategy Traces"
                      selectedTraceIndex={csTraceIndex}
                      selectedStep={csStep}
                      onTraceSelect={(index) => {
                        setCsTraceIndex(index);
                        setCsStep(0);
                      }}
                      onStepSelect={setCsStep}
                    />
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
