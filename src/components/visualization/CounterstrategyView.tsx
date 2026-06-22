import { useRef, useEffect } from "react";
import cytoscape from "cytoscape";
import type { CounterstrategyResult } from "../../api/endpoints";
import { DownloadJsonButton } from "../common/DownloadJsonButton";
import { counterstrategyViewStyles } from "./graphStyles";
import "./CounterstrategyView.css";

interface CounterstrategyViewProps {
  result: CounterstrategyResult;
  formulaName: string;
  automatonName: string;
}

export const CounterstrategyView = ({
  result,
  formulaName,
  automatonName,
}: CounterstrategyViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || result.graph_elements.length === 0) return;

    const elements = result.graph_elements.map((el) => ({
      data: el.data,
      position: el.position || undefined,
      classes: el.classes || undefined,
    }));

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements as cytoscape.ElementDefinition[],
      style: counterstrategyViewStyles,
      layout: {
        name: "cose",
        padding: 30,
        animate: false,
      },
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [result.graph_elements]);

  return (
    <div className="counterstrategy-view">
      <div className="counterstrategy-view__header">
        <h4>
          Environment Counterstrategy: {formulaName} on {automatonName}
        </h4>
        <p className="counterstrategy-view__description">
          The environment can force violation from{" "}
          <strong>{result.environment_winning_states.length}</strong> states
          {result.minimized && " (minimized)"}
        </p>
        <DownloadJsonButton
          data={result}
          filename={`${automatonName}_${formulaName}_counterstrategy.json`}
        />
      </div>

      <div className="counterstrategy-view__winning-states">
        {result.environment_winning_states.map((state, i) => (
          <span key={i} className="counterstrategy-view__state-badge">
            {state}
          </span>
        ))}
      </div>

      <div
        ref={containerRef}
        className="counterstrategy-view__graph"
        style={{ width: "100%", height: "400px", border: "1px solid #e5e7eb" }}
      />
    </div>
  );
};
