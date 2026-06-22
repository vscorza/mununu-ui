import { useState } from "react";
import { TraceViewer } from "./TraceViewer";
import { DownloadJsonButton } from "../common/DownloadJsonButton";

interface DeadlockTraceViewerProps {
  traces: string[][];
}

export const DeadlockTraceViewer = ({ traces }: DeadlockTraceViewerProps) => {
  const [selectedTraceIndex, setSelectedTraceIndex] = useState(0);
  const [selectedStep, setSelectedStep] = useState(0);

  if (!traces || traces.length === 0) {
    return null;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "0.5rem",
        }}
      >
        <DownloadJsonButton data={traces} filename="deadlock_traces.json" />
      </div>
      <TraceViewer
        traces={traces}
        title="Deadlock Traces"
        selectedTraceIndex={selectedTraceIndex}
        selectedStep={selectedStep}
        onTraceSelect={(index) => {
          setSelectedTraceIndex(index);
          setSelectedStep(0);
        }}
        onStepSelect={setSelectedStep}
      />
    </div>
  );
};
