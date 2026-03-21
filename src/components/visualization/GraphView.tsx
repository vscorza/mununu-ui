import { useEffect, useRef } from "react";
import cytoscape, { Core } from "cytoscape";
import dagre from "cytoscape-dagre";
import type { paths } from "../../api/types";
import "./GraphView.css";

// Register dagre layout
cytoscape.use(dagre);

type GraphData =
  paths["/api/v1/context/graphs"]["post"]["responses"]["200"]["content"]["application/json"]["graphs"][0];

interface GraphViewProps {
  graph: GraphData;
  searchText?: string;
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeHover?: (nodeId: string | null, data: any) => void;
  layout?: "dagre" | "breadthfirst" | "grid" | "preset";
  onCyInit?: (cy: Core) => void;
}

export const GraphView = ({
  graph,
  searchText = "",
  selectedNodeId = null,
  onNodeSelect,
  onNodeHover,
  layout = "dagre",
  onCyInit,
}: GraphViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cytoscape
    // Convert graph elements to Cytoscape format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elements: any[] = graph.elements.map((el) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element: any = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: el.data as any,
      };
      if (el.position) {
        element.position = el.position;
      }
      if (el.classes) {
        element.classes = el.classes;
      }
      return element;
    });

    const cy = cytoscape({
      container: containerRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      elements: elements as any,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#ffffff",
            label: "data(label)",
            width: 40,
            height: 40,
            "font-size": 12,
            "text-valign": "bottom",
            "text-halign": "center",
            color: "#000000",
            "border-width": 2,
            "border-color": "#9ca3af",
            "text-margin-y": 4,
          },
        },
        {
          selector: "node:selected",
          style: {
            "background-color": "#ef4444",
            "border-color": "#fca5a5",
            "border-width": 3,
          },
        },
        {
          selector: "node[?initial]",
          style: {
            "background-color": "#ffffff",
            "border-color": "#10b981",
            "border-width": 3,
            shape: "diamond",
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
            color: "#000000",
          },
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            width: 3,
          },
        },
      ],
      layout: {
        name: layout === "preset" ? "preset" : layout,
        fit: true,
        padding: 30,
        animate: false,
      },
    });

    cyRef.current = cy;
    if (onCyInit) onCyInit(cy);

    // Handle node/edge clicks
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect(node.id());
      }
    });

    cy.on("tap", "edge", () => {
      if (onNodeSelect) {
        onNodeSelect(null);
      }
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        if (onNodeSelect) {
          onNodeSelect(null);
        }
      }
    });

    // Handle hover for tooltips
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const data = node.data();
      if (onNodeHover) {
        onNodeHover(node.id(), data);
      }
    });

    cy.on("mouseover", "edge", (evt) => {
      const edge = evt.target;
      const data = edge.data();
      if (onNodeHover) {
        onNodeHover(null, data);
      }
    });

    cy.on("mouseout", () => {
      if (onNodeHover) {
        onNodeHover(null, null);
      }
    });

    // Highlight search results
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      cy.nodes().forEach((node) => {
        const label = node.data("label") || "";
        if (label.toLowerCase().includes(searchLower)) {
          node.addClass("search-match");
        } else {
          node.removeClass("search-match");
        }
      });
    }

    // Highlight selected node
    if (selectedNodeId) {
      cy.nodes().forEach((node) => {
        if (node.id() === selectedNodeId) {
          node.select();
        } else {
          node.unselect();
        }
      });
    }

    return () => {
      cy.destroy();
    };
  }, [graph, layout, searchText, selectedNodeId, onNodeSelect, onNodeHover]);

  return (
    <div className="graph-view-container">
      <div ref={containerRef} className="graph-view-canvas" />
      <div ref={tooltipRef} className="graph-view-tooltip" />
    </div>
  );
};
