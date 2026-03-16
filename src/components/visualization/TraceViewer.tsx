import { Button } from '../common/Button'
import './TraceViewer.css'

interface TraceViewerProps {
  traces: string[][]
  title: string
  selectedTraceIndex: number
  selectedStep: number
  onTraceSelect: (index: number) => void
  onStepSelect: (step: number) => void
}

export const TraceViewer = ({
  traces,
  title,
  selectedTraceIndex,
  selectedStep,
  onTraceSelect,
  onStepSelect,
}: TraceViewerProps) => {
  if (!traces || traces.length === 0) {
    return (
      <div className="trace-viewer-empty">
        <p>No {title.toLowerCase()} available</p>
      </div>
    )
  }

  const currentTrace = traces[selectedTraceIndex] || traces[0]
  const hasMultipleTraces = traces.length > 1

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
              onChange={e => onTraceSelect(parseInt(e.target.value, 10))}
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
          {currentTrace.map((step, index) => (
            <div
              key={index}
              className={`trace-viewer-step ${selectedStep === index ? 'trace-viewer-step-selected' : ''}`}
              onClick={() => onStepSelect(index)}
            >
              <div className="trace-viewer-step-number">{index + 1}</div>
              <div className="trace-viewer-step-content">{step}</div>
            </div>
          ))}
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
            onClick={() => onStepSelect(Math.min(currentTrace.length - 1, selectedStep + 1))}
            disabled={selectedStep === currentTrace.length - 1}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  )
}
