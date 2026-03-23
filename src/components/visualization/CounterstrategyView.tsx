import { useRef, useEffect } from "react";
import cytoscape from "cytoscape";
import type { CounterstrategyResult } from "../../api/endpoints";
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
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "background-color": "#fbbf24",
            "border-color": "#d97706",
            "border-width": 2,
            width: 60,
            height: 60,
            "font-size": 11,
          },
        },
        {
          selector: "node.start",
          style: {
            "border-width": 4,
            "border-color": "#dc2626",
          },
        },
        {
          selector: "node.entry",
          style: {
            width: 1,
            height: 1,
            label: "",
            "background-opacity": 0,
            "border-opacity": 0,
          },
        },
        {
          selector: "node:parent",
          style: {
            "background-color": "#fef3c7",
            "border-color": "#d97706",
            "border-width": 1,
            label: "data(label)",
            "text-valign": "top",
            "font-size": 13,
            "font-weight": "bold",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            padding: "20px" as any,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#9ca3af",
            "target-arrow-color": "#9ca3af",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 10,
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            color: "#000",
          },
        },
        {
          selector: 'edge[action_type="uncontrollable"]',
          style: {
            "line-color": "#dc2626",
            "target-arrow-color": "#dc2626",
            "line-style": "dashed",
          },
        },
        {
          selector: 'edge[action_type="start-arrow"]',
          style: {
            width: 1,
            "line-color": "#6b7280",
            "target-arrow-color": "#6b7280",
            label: "",
          },
        },
      ],
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
