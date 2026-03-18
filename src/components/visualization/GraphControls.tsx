import { Button } from "../common/Button";
import "./GraphControls.css";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onLayoutChange?: (layout: string) => void;
  currentLayout?: string;
}

export const GraphControls = ({
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onLayoutChange,
  currentLayout,
}: GraphControlsProps) => {
  return (
    <div className="graph-controls">
      <div className="graph-controls-group">
        <Button variant="ghost" size="sm" onClick={onZoomIn} title="Zoom in">
          🔍+
        </Button>
        <Button variant="ghost" size="sm" onClick={onZoomOut} title="Zoom out">
          🔍-
        </Button>
        <Button variant="ghost" size="sm" onClick={onFit} title="Fit to view">
          ⛶ Fit
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} title="Reset view">
          ↺ Reset
        </Button>
      </div>
      {onLayoutChange && (
        <div className="graph-controls-group">
          <select
            className="graph-controls-layout-select"
            value={currentLayout || "dagre"}
            onChange={(e) => onLayoutChange(e.target.value)}
            title="Layout algorithm"
          >
            <option value="dagre">Dagre</option>
            <option value="breadthfirst">Breadthfirst</option>
            <option value="grid">Grid</option>
            <option value="preset">Preset</option>
          </select>
        </div>
      )}
    </div>
  );
};
