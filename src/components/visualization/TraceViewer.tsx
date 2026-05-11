import { Button } from "../common/Button";
import type { TransitionObservation } from "../../api/endpoints";
import "./TraceViewer.css";

interface TraceViewerProps {
  traces: string[][];
  title: string;
  selectedTraceIndex: number;
  selectedStep: number;
  onTraceSelect: (index: number) => void;
  onStepSelect: (step: number) => void;
  /**
   * Optional per-state structured valuations for the automaton this
   * trace covers. Map keys are state names; each value is a
   * `{ variable: value }` map (Moore output ports + register cells).
   * Rendered inline alongside each step name.
   */
  stateValuations?: Record<string, Record<string, string>>;
  /**
   * Optional per-transition Mealy observations for the automaton.
   * Each row is matched to a trace hop by `(source, target)`; when
   * a match exists the row's `observations` map is rendered between
   * the step and its successor.
   */
  transitionObservations?: TransitionObservation[];
}

const formatPairs = (pairs: Record<string, string>): string =>
  Object.entries(pairs)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

export const TraceViewer = ({
  traces,
  title,
  selectedTraceIndex,
  selectedStep,
  onTraceSelect,
  onStepSelect,
  stateValuations,
  transitionObservations,
}: TraceViewerProps) => {
  if (!traces || traces.length === 0) {
    return (
      <div className="trace-viewer-empty">
        <p>No {title.toLowerCase()} available</p>
      </div>
    );
  }

  const currentTrace = traces[selectedTraceIndex] || traces[0];
  const hasMultipleTraces = traces.length > 1;

  return (
    <div className="trace-viewer">
      <div className="trace-viewer-header">
        <h3 className="trace-viewer-title">{title}</h3>
        {hasMultipleTraces && (
          <div className="trace-viewer-selector">
            <label className="trace-viewer-label">Trace:</label>
            <select
              className="trace-viewer-select"
              value={selectedTraceIndex}
              onChange={(e) => onTraceSelect(parseInt(e.target.value, 10))}
            >
              {traces.map((_, index) => (
                <option key={index} value={index}>
                  Trace {index + 1}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="trace-viewer-content">
        <div className="trace-viewer-steps">
          {currentTrace.map((step, index) => {
            const valuation = stateValuations?.[step];
            const next = currentTrace[index + 1];
            const observation = next
              ? transitionObservations?.find(
                  (row) => row.source === step && row.target === next,
                )
              : undefined;
            return (
              <div
                key={index}
                className={`trace-viewer-step ${selectedStep === index ? "trace-viewer-step-selected" : ""}`}
                onClick={() => onStepSelect(index)}
              >
                <div className="trace-viewer-step-number">{index + 1}</div>
                <div className="trace-viewer-step-content">
                  <div className="trace-viewer-step-name">{step}</div>
                  {valuation && Object.keys(valuation).length > 0 && (
                    <div className="trace-viewer-step-valuations">
                      {`{${formatPairs(valuation)}}`}
                    </div>
                  )}
                  {observation &&
                    Object.keys(observation.observations).length > 0 && (
                      <div className="trace-viewer-step-observations">
                        {`↳ observed: ${formatPairs(observation.observations)}`}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="trace-viewer-navigation">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStepSelect(Math.max(0, selectedStep - 1))}
            disabled={selectedStep === 0}
          >
            ← Previous
          </Button>
          <span className="trace-viewer-step-info">
            Step {selectedStep + 1} of {currentTrace.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onStepSelect(Math.min(currentTrace.length - 1, selectedStep + 1))
            }
            disabled={selectedStep === currentTrace.length - 1}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
};
