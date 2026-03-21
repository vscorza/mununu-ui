import { Button } from "../common/Button";
import "./GraphControls.css";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onLayoutChange?: (layout: string) => void;
  currentLayout?: string;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  onExportPNG?: () => void;
}

export const GraphControls = ({
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onLayoutChange,
  currentLayout,
  onToggleExpand,
  isExpanded,
  onExportPNG,
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
      {onExportPNG && (
        <div className="graph-controls-group">
          <Button variant="ghost" size="sm" onClick={onExportPNG} title="Download as PNG">
            PNG
          </Button>
        </div>
      )}
      {onToggleExpand && (
        <div className="graph-controls-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
          >
            {isExpanded ? "↙ Exit" : "↗ Expand"}
          </Button>
        </div>
      )}
    </div>
  );
};
