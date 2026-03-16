import { CounterexampleView } from './CounterexampleView'
import { CounterstrategyView } from './CounterstrategyView'
import { DeadlockTraces } from './DeadlockTraces'
import { ProofObligations } from './ProofObligations'
import { Tabs } from '../common/Tabs'
import type { paths } from '../../api/types'
import './DiagnosticsView.css'

type SynthesisDiagnostics =
  paths['/api/v1/context/synthesize']['post']['responses']['200']['content']['application/json']['diagnostics']

interface DiagnosticsViewProps {
  diagnostics: SynthesisDiagnostics | null
  selectedCounterstrategyIndex: number
  selectedCounterstrategyStep: number
  selectedDeadlockIndex: number
  selectedDeadlockStep: number
  selectedCounterexampleStep: number
  onCounterstrategyTraceSelect: (index: number) => void
  onCounterstrategyStepSelect: (step: number) => void
  onDeadlockTraceSelect: (index: number) => void
  onDeadlockStepSelect: (step: number) => void
  onCounterexampleStepSelect: (step: number) => void
}

export const DiagnosticsView = ({
  diagnostics,
  selectedCounterstrategyIndex,
  selectedCounterstrategyStep,
  selectedDeadlockIndex,
  selectedDeadlockStep,
  selectedCounterexampleStep,
  onCounterstrategyTraceSelect,
  onCounterstrategyStepSelect,
  onDeadlockTraceSelect,
  onDeadlockStepSelect,
  onCounterexampleStepSelect,
}: DiagnosticsViewProps) => {
  if (!diagnostics) {
    return (
      <div className="diagnostics-view-empty">
        <p>No diagnostics available</p>
      </div>
    )
  }

  const hasCounterexample =
    diagnostics.counterexample_trace && diagnostics.counterexample_trace.length > 0
  const hasCounterstrategies =
    diagnostics.counterstrategy_traces && diagnostics.counterstrategy_traces.length > 0
  const hasDeadlocks = diagnostics.deadlock_traces && diagnostics.deadlock_traces.length > 0
  const hasProofObligations =
    diagnostics.proof_obligations && diagnostics.proof_obligations.length > 0
  const hasViolatingInitials =
    diagnostics.violating_initials && diagnostics.violating_initials.length > 0
  const hasMinimization = diagnostics.minimization !== null
  const hasMessages = diagnostics.messages && diagnostics.messages.length > 0

  const tabs = []

  if (hasCounterexample) {
    tabs.push({
      id: 'counterexample',
      label: 'Counterexample',
      content: (
        <CounterexampleView
          counterexampleTrace={diagnostics.counterexample_trace || null}
          selectedStep={selectedCounterexampleStep}
          onStepSelect={onCounterexampleStepSelect}
        />
      ),
    })
  }

  if (hasCounterstrategies) {
    tabs.push({
      id: 'counterstrategies',
      label: 'Counterstrategies',
      content: (
        <CounterstrategyView
          counterstrategyTraces={diagnostics.counterstrategy_traces || []}
          selectedTraceIndex={selectedCounterstrategyIndex}
          selectedStep={selectedCounterstrategyStep}
          onTraceSelect={onCounterstrategyTraceSelect}
          onStepSelect={onCounterstrategyStepSelect}
        />
      ),
    })
  }

  if (hasDeadlocks) {
    tabs.push({
      id: 'deadlocks',
      label: 'Deadlocks',
      content: (
        <DeadlockTraces
          deadlockTraces={diagnostics.deadlock_traces || []}
          selectedTraceIndex={selectedDeadlockIndex}
          selectedStep={selectedDeadlockStep}
          onTraceSelect={onDeadlockTraceSelect}
          onStepSelect={onDeadlockStepSelect}
        />
      ),
    })
  }

  if (hasProofObligations) {
    tabs.push({
      id: 'proof-obligations',
      label: 'Proof Obligations',
      content: <ProofObligations proofObligations={diagnostics.proof_obligations || []} />,
    })
  }

  if (hasViolatingInitials || hasMinimization || hasMessages) {
    tabs.push({
      id: 'additional',
      label: 'Additional Info',
      content: (
        <div className="diagnostics-additional-info">
          {hasViolatingInitials && (
            <div className="diagnostics-section">
              <h4 className="diagnostics-section-title">Violating Initial States</h4>
              <div className="diagnostics-violating-initials">
                {diagnostics.violating_initials?.map((state, index) => (
                  <span key={index} className="diagnostics-violating-initial">
                    {state}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasMinimization && diagnostics.minimization && (
            <div className="diagnostics-section">
              <h4 className="diagnostics-section-title">Minimization Report</h4>
              <div className="diagnostics-minimization">
                <div className="diagnostics-minimization-item">
                  <span className="diagnostics-minimization-label">Removed States:</span>
                  <span className="diagnostics-minimization-value">
                    {diagnostics.minimization.removed_states}
                  </span>
                </div>
                <div className="diagnostics-minimization-item">
                  <span className="diagnostics-minimization-label">Removed Transitions:</span>
                  <span className="diagnostics-minimization-value">
                    {diagnostics.minimization.removed_transitions}
                  </span>
                </div>
                {diagnostics.minimization.merged_states &&
                  diagnostics.minimization.merged_states.length > 0 && (
                    <div className="diagnostics-minimization-item">
                      <span className="diagnostics-minimization-label">Merged States:</span>
                      <div className="diagnostics-merged-states">
                        {diagnostics.minimization.merged_states.map((state, index) => (
                          <span key={index} className="diagnostics-merged-state">
                            {state}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {hasMessages && (
            <div className="diagnostics-section">
              <h4 className="diagnostics-section-title">Messages</h4>
              <div className="diagnostics-messages">
                {diagnostics.messages?.map((message, index) => (
                  <div key={index} className="diagnostics-message">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    })
  }

  if (tabs.length === 0) {
    return (
      <div className="diagnostics-view-empty">
        <p>No diagnostic information available</p>
      </div>
    )
  }

  return (
    <div className="diagnostics-view">
      <Tabs tabs={tabs} />
    </div>
  )
}
