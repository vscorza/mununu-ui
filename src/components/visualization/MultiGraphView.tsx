import { useState, useRef, useCallback } from "react";
import { GraphView } from "./GraphView";
import { GraphControls } from "./GraphControls";
import { GraphMetadata } from "./GraphMetadata";
import { Tabs } from "../common/Tabs";
import type { paths } from "../../api/types";
import type { LayoutType } from "../../hooks/useGraphVisualization";
import "./MultiGraphView.css";

type GraphData =
  paths["/api/v1/context/graphs"]["post"]["responses"]["200"]["content"]["application/json"]["graphs"][0];

interface MultiGraphViewProps {
  graphs: GraphData[];
  searchText: string;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export const MultiGraphView = ({
  graphs,
  searchText,
  selectedNodeId,
  onNodeSelect,
}: MultiGraphViewProps) => {
  const [selectedGraphIndex, setSelectedGraphIndex] = useState(0);
  const [layout, setLayout] = useState<LayoutType>("dagre");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphViewRef = useRef<{ cy?: any }>(null);

  const currentGraph = graphs[selectedGraphIndex];

  const handleZoomIn = useCallback(() => {
    const cy = graphViewRef.current?.cy;
    if (cy) {
      cy.zoom(cy.zoom() * 1.2);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const cy = graphViewRef.current?.cy;
    if (cy) {
      cy.zoom(cy.zoom() * 0.8);
    }
  }, []);

  const handleFit = useCallback(() => {
    const cy = graphViewRef.current?.cy;
    if (cy) {
      cy.fit(undefined, 50);
    }
  }, []);

  const handleReset = useCallback(() => {
    const cy = graphViewRef.current?.cy;
    if (cy) {
      cy.reset();
      cy.fit(undefined, 50);
    }
  }, []);

  const handleLayoutChange = useCallback((newLayout: string) => {
    setLayout(newLayout as LayoutType);
  }, []);

  if (!currentGraph) {
    return (
      <div className="multi-graph-view-empty">
        <p>No graphs available</p>
      </div>
    );
  }

  const tabs = graphs.map((graph: GraphData, index: number) => ({
    id: `graph-${index}`,
    label: `${graph.automaton} (${graph.graph_type})`,
    content: (
      <div className="multi-graph-view-content">
        <GraphMetadata
          automaton={graph.automaton}
          graphType={graph.graph_type}
          statesCount={graph.metadata.states_count}
          transitionsCount={graph.metadata.transitions_count}
          initialStates={graph.metadata.initial_states}
        />
        <div className="multi-graph-view-graph-wrapper">
          <GraphControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleFit}
            onReset={handleReset}
            onLayoutChange={handleLayoutChange}
            currentLayout={layout}
          />
          <div className="multi-graph-view-graph-container">
            <GraphView
              key={`${graph.automaton}-${graph.graph_type}-${layout}`}
              graph={graph}
              searchText={searchText}
              selectedNodeId={selectedNodeId}
              onNodeSelect={onNodeSelect}
              layout={layout}
            />
            <div
              ref={(el) => {
                if (el) {
                  graphViewRef.current = {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    cy: (el.querySelector(".graph-view-canvas") as any)?.cy,
                  };
                }
              }}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div className="multi-graph-view">
      <Tabs
        tabs={tabs}
        onChange={(tabId) => {
          const index = parseInt(tabId.replace("graph-", ""), 10);
          if (!isNaN(index)) {
            setSelectedGraphIndex(index);
          }
        }}
        defaultTab={tabs[0]?.id}
      />
    </div>
  );
};
