import { TraceViewer } from './TraceViewer'
import './CounterexampleView.css'

interface CounterexampleViewProps {
  counterexampleTrace?: string[] | null
  selectedStep: number
  onStepSelect: (step: number) => void
}

export const CounterexampleView = ({
  counterexampleTrace,
  selectedStep,
  onStepSelect,
}: CounterexampleViewProps) => {
  if (!counterexampleTrace || counterexampleTrace.length === 0) {
    return (
      <div className="counterexample-view-empty">
        <p>No counterexample trace available</p>
      </div>
    )
  }

  return (
    <div className="counterexample-view">
      <TraceViewer
        traces={[counterexampleTrace]}
        title="Counterexample Trace"
        selectedTraceIndex={0}
        selectedStep={selectedStep}
        onTraceSelect={() => {}}
        onStepSelect={onStepSelect}
      />
      <div className="counterexample-view-info">
        <p className="counterexample-view-description">
          This counterexample trace shows a sequence of states that violates the specification. Each
          step represents a state in the trace that leads to the violation.
        </p>
      </div>
    </div>
  )
}
