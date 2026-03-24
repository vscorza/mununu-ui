interface LassoTrace {
  prefix: string[];
  cycle: string[];
}

interface LassoTraceViewerProps {
  traces: LassoTrace[];
  title: string;
}

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
      <h3 className="lasso-trace-viewer__title">{title}</h3>
      {traces.map((trace, index) => (
        <div key={index} className="lasso-trace-viewer__trace">
          <span className="lasso-trace-viewer__label">Trace {index + 1}:</span>
          <span className="lasso-trace-viewer__steps">
            {trace.prefix.map((step, i) => (
              <span key={`p-${i}`}>
                {i > 0 && <span className="lasso-trace-viewer__arrow"> → </span>}
                <span className="lasso-trace-viewer__prefix-step">{step}</span>
              </span>
            ))}
            {trace.prefix.length > 0 && trace.cycle.length > 0 && (
              <span className="lasso-trace-viewer__arrow"> → </span>
            )}
            {trace.cycle.length > 0 && (
              <span className="lasso-trace-viewer__cycle">
                {"("}
                {trace.cycle.map((step, i) => (
                  <span key={`c-${i}`}>
                    {i > 0 && <span className="lasso-trace-viewer__arrow"> → </span>}
                    <strong className="lasso-trace-viewer__cycle-step">{step}</strong>
                  </span>
                ))}
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
