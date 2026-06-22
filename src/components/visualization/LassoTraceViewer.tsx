import { DownloadJsonButton } from "../common/DownloadJsonButton";

interface LassoTrace {
  prefix: string[];
  cycle: string[];
  prefix_labels?: string[];
  cycle_labels?: string[];
}

interface LassoTraceViewerProps {
  traces: LassoTrace[];
  title: string;
}

/** Render an arrow, optionally with a transition label above it. */
const Arrow = ({ label }: { label?: string }) => (
  <span className="lasso-trace-viewer__arrow">
    {label ? (
      <>
        {" "}
        <span
          style={{
            fontSize: "0.8em",
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          {label}
        </span>
        {" → "}
      </>
    ) : (
      " → "
    )}
  </span>
);

export const LassoTraceViewer = ({ traces, title }: LassoTraceViewerProps) => {
  if (!traces || traces.length === 0) {
    return (
      <div className="lasso-trace-viewer">
        <p>No lasso traces available</p>
      </div>
    );
  }

  return (
    <div className="lasso-trace-viewer">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <h3 className="lasso-trace-viewer__title">{title}</h3>
        <DownloadJsonButton data={traces} filename="lasso_traces.json" />
      </div>
      {traces.map((trace, index) => (
        <div key={index} className="lasso-trace-viewer__trace">
          <span className="lasso-trace-viewer__label">Trace {index + 1}:</span>
          <span className="lasso-trace-viewer__steps">
            {trace.prefix.map((step, i) => (
              <span key={`p-${i}`}>
                {i > 0 && <Arrow label={trace.prefix_labels?.[i - 1]} />}
                <span className="lasso-trace-viewer__prefix-step">{step}</span>
              </span>
            ))}
            {trace.prefix.length > 0 && trace.cycle.length > 0 && (
              <Arrow label={trace.prefix_labels?.[trace.prefix.length - 1]} />
            )}
            {trace.cycle.length > 0 && (
              <span className="lasso-trace-viewer__cycle">
                {"("}
                {trace.cycle.map((step, i) => (
                  <span key={`c-${i}`}>
                    {i > 0 && <Arrow label={trace.cycle_labels?.[i - 1]} />}
                    <strong className="lasso-trace-viewer__cycle-step">
                      {step}
                    </strong>
                  </span>
                ))}
                {/* Closing label: transition from last cycle state back to first */}
                {trace.cycle_labels && trace.cycle_labels.length > 0 && (
                  <Arrow
                    label={trace.cycle_labels[trace.cycle_labels.length - 1]}
                  />
                )}
                {")"}
                <sup>&omega;</sup>
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
