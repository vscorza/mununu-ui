import { TraceViewer } from './TraceViewer'
import './DeadlockTraces.css'

interface DeadlockTracesProps {
  deadlockTraces?: string[][]
  selectedTraceIndex: number
  selectedStep: number
  onTraceSelect: (index: number) => void
  onStepSelect: (step: number) => void
}

export const DeadlockTraces = ({
  deadlockTraces,
  selectedTraceIndex,
  selectedStep,
  onTraceSelect,
  onStepSelect,
}: DeadlockTracesProps) => {
  if (!deadlockTraces || deadlockTraces.length === 0) {
    return (
      <div className="deadlock-traces-empty">
        <p>No deadlock traces available</p>
      </div>
    )
  }

  return (
    <div className="deadlock-traces">
      <TraceViewer
        traces={deadlockTraces}
        title="Deadlock Traces"
        selectedTraceIndex={selectedTraceIndex}
        selectedStep={selectedStep}
        onTraceSelect={onTraceSelect}
        onStepSelect={onStepSelect}
      />
      <div className="deadlock-traces-info">
        <p className="deadlock-traces-description">
          Deadlock traces show execution paths that lead to states where no further progress is
          possible. These indicate situations where the system cannot continue executing.
        </p>
      </div>
    </div>
  )
}
