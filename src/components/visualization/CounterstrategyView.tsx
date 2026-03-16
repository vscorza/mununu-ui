import { TraceViewer } from './TraceViewer'
import './CounterstrategyView.css'

interface CounterstrategyViewProps {
  counterstrategyTraces?: string[][]
  selectedTraceIndex: number
  selectedStep: number
  onTraceSelect: (index: number) => void
  onStepSelect: (step: number) => void
}

export const CounterstrategyView = ({
  counterstrategyTraces,
  selectedTraceIndex,
  selectedStep,
  onTraceSelect,
  onStepSelect,
}: CounterstrategyViewProps) => {
  if (!counterstrategyTraces || counterstrategyTraces.length === 0) {
    return (
      <div className="counterstrategy-view-empty">
        <p>No counterstrategy traces available</p>
      </div>
    )
  }

  return (
    <div className="counterstrategy-view">
      <TraceViewer
        traces={counterstrategyTraces}
        title="Counterstrategy Traces"
        selectedTraceIndex={selectedTraceIndex}
        selectedStep={selectedStep}
        onTraceSelect={onTraceSelect}
        onStepSelect={onStepSelect}
      />
      <div className="counterstrategy-view-info">
        <p className="counterstrategy-view-description">
          Counterstrategy traces show alternative execution paths that lead to specification
          violations. These traces help identify why the controller synthesis failed.
        </p>
      </div>
    </div>
  )
}
