/**
 * Shared Cytoscape style definitions for consistent graph rendering
 * across GraphView and CounterstrategyView.
 */
import type cytoscape from "cytoscape";

type StylesheetStyle = cytoscape.StylesheetStyle;

/**
 * Build the multi-line label for a state node: the state name on the first
 * line, with structured valuations (or, for unrolled graphs, `vars` strings)
 * formatted as `{key1=val1, key2=val2}` underneath. Used by both the standard
 * graph view and the counterstrategy view.
 */
const stateNodeLabel = (ele: cytoscape.NodeSingular): string => {
  const base = (ele.data("label") as string | undefined) ?? "";
  const valuations = ele.data("valuations") as
    | Record<string, string>
    | undefined
    | null;
  if (valuations && typeof valuations === "object") {
    const keys = Object.keys(valuations);
    if (keys.length > 0) {
      const pairs = keys.map((k) => `${k}=${valuations[k]}`).join(", ");
      return `${base}\n{${pairs}}`;
    }
  }
  const vars = ele.data("vars") as string[] | undefined;
  if (Array.isArray(vars) && vars.length > 0) {
    return `${base}\n{${vars.join(", ")}}`;
  }
  return base;
};

/** Base node style shared across all graph views. */
export const baseNodeStyle: StylesheetStyle = {
  selector: "node",
  style: {
    "background-color": "#ffffff",
    label: stateNodeLabel,
    width: 40,
    height: 40,
    "font-size": 12,
    "text-valign": "bottom",
    "text-halign": "center",
    color: "#000000",
    "border-width": 2,
    "border-color": "#9ca3af",
    "text-margin-y": 4,
    "text-wrap": "wrap",
    "text-max-width": "180px",
  },
};

/** Initial state node (class="start" from backend). Green diamond. */
export const initialNodeStyle: StylesheetStyle = {
  selector: "node.start",
  style: {
    "background-color": "#ffffff",
    "border-color": "#10b981",
    "border-width": 3,
    shape: "diamond",
  },
};

/** Entry arrow helper node (invisible, used for initial state arrows). */
export const entryNodeStyle: StylesheetStyle = {
  selector: "node.entry",
  style: {
    width: 1,
    height: 1,
    label: "",
    "background-opacity": 0,
    "border-opacity": 0,
  },
};

/** Selected node highlight. */
export const selectedNodeStyle: StylesheetStyle = {
  selector: "node:selected",
  style: {
    "background-color": "#ef4444",
    "border-color": "#fca5a5",
    "border-width": 3,
  },
};

/** Compound (parent) node style. */
export const parentNodeStyle: StylesheetStyle = {
  selector: "node:parent",
  style: {
    "background-color": "#f3f4f6",
    "border-color": "#9ca3af",
    "border-width": 1,
    label: "data(label)",
    "text-valign": "top",
    "font-size": 13,
    "font-weight": "bold",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    padding: "20px" as any,
  },
};

/** Base edge style (default gray). */
export const baseEdgeStyle: StylesheetStyle = {
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
};

/** Controllable edge (blue solid). */
export const controllableEdgeStyle: StylesheetStyle = {
  selector: 'edge[action_type="controllable"]',
  style: {
    "line-color": "#2563eb",
    "target-arrow-color": "#2563eb",
  },
};

/** Uncontrollable edge (red dashed). */
export const uncontrollableEdgeStyle: StylesheetStyle = {
  selector: 'edge[action_type="uncontrollable"]',
  style: {
    "line-color": "#dc2626",
    "target-arrow-color": "#dc2626",
    "line-style": "dashed",
  },
};

/** Start-arrow edge (thin gray, for initial state entry arrows). */
export const startArrowEdgeStyle: StylesheetStyle = {
  selector: 'edge[action_type="start-arrow"]',
  style: {
    width: 1,
    "line-color": "#6b7280",
    "target-arrow-color": "#6b7280",
    label: "",
  },
};

/** Selected edge highlight. */
export const selectedEdgeStyle: StylesheetStyle = {
  selector: "edge:selected",
  style: {
    "line-color": "#ef4444",
    "target-arrow-color": "#ef4444",
    width: 3,
  },
};

/** Standard graph styles used by GraphView (general CLTS graphs). */
export const graphViewStyles: StylesheetStyle[] = [
  baseNodeStyle,
  selectedNodeStyle,
  initialNodeStyle,
  entryNodeStyle,
  parentNodeStyle,
  baseEdgeStyle,
  controllableEdgeStyle,
  uncontrollableEdgeStyle,
  startArrowEdgeStyle,
  selectedEdgeStyle,
];

/** Counterstrategy-specific node style overrides. */
const counterstrategyNodeStyle: StylesheetStyle = {
  selector: "node",
  style: {
    "background-color": "#fbbf24",
    "border-color": "#d97706",
    "border-width": 2,
    width: 60,
    height: 60,
    "font-size": 11,
    "text-valign": "center",
    "text-halign": "center",
    label: stateNodeLabel,
    color: "#000000",
    "text-wrap": "wrap",
    "text-max-width": "180px",
  },
};

/** Counterstrategy compound node style. */
const counterstrategyParentStyle: StylesheetStyle = {
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
};

/** Styles used by CounterstrategyView (amber theme with shared edge/initial styles). */
export const counterstrategyViewStyles: StylesheetStyle[] = [
  counterstrategyNodeStyle,
  initialNodeStyle,
  entryNodeStyle,
  counterstrategyParentStyle,
  baseEdgeStyle,
  controllableEdgeStyle,
  uncontrollableEdgeStyle,
  startArrowEdgeStyle,
];
