import { useState } from "react";
import { Button } from "../common/Button";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ExamplesPicker } from "./ExamplesPicker";
import "./EditorToolbar.css";

/**
 * SystemVerilog frontend selector — exposed in the toolbar so users can
 * opt into the Yosys-driven elaboration path (Phase 1 RTL roadmap).
 *
 * - `hand`   — the original hand-written SV adapter (default; FSM-class scope).
 * - `yosys`  — Yosys child-process elaboration → BTOR2 → CLTS. Requires
 *              `yosys` ≥ 0.40 on the server's PATH (or `MUNUNU_YOSYS_PATH`).
 *              Handles generate blocks, interfaces, parameters, multi-bit
 *              arithmetic; SVA assertions are monitorized via `chformal -lower`.
 */
export type SvFrontend = "hand" | "yosys";

interface EditorToolbarProps {
  fileName: string;
  isDirty: boolean;
  isValidating: boolean;
  onNew: () => void;
  onSave: () => void;
  onValidate: () => void | Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  onLoadFile?: (file: File, svFrontend?: SvFrontend) => void | Promise<void>;
  onLoadExample?: (content: string, fileName: string) => void;
}

export const EditorToolbar = ({
  fileName,
  isDirty,
  isValidating,
  onNew,
  onSave,
  onValidate,
  onUndo,
  onRedo,
  onLoadFile,
  onLoadExample,
}: EditorToolbarProps) => {
  const [svFrontend, setSvFrontend] = useState<SvFrontend>("hand");

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadFile) {
      onLoadFile(file, svFrontend);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-filename">
        <span>
          {fileName}
          {isDirty && <span className="editor-toolbar-filename-dirty">●</span>}
        </span>
      </div>

      <div className="editor-toolbar-actions">
        <Button variant="ghost" size="sm" onClick={onNew} title="New file">
          📄 New
        </Button>

        {onLoadFile && (
          <>
            <label className="editor-toolbar-file-label">
              <input
                type="file"
                accept=".ctxdsl,.txt,.sv,.v,.json,.xstate,.tlsf,.aag,.aig,.btor,.btor2,.pml,.promela"
                onChange={handleFileInput}
                className="editor-toolbar-file-input"
              />
              <span className="button button-ghost button-sm" title="Open file">
                📂 Open
              </span>
            </label>
            <label
              className="editor-toolbar-sv-frontend"
              title="Frontend used when opening a SystemVerilog (.sv/.v) file. The Yosys frontend (Phase 1) elaborates the design via the Yosys child process and translates the resulting BTOR2 to CLTS."
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "12px",
                color: "var(--text-muted, #888)",
                marginLeft: 4,
              }}
            >
              SV:
              <select
                value={svFrontend}
                onChange={(e) => setSvFrontend(e.target.value as SvFrontend)}
                style={{ fontSize: "12px" }}
              >
                <option value="hand">hand</option>
                <option value="yosys">yosys</option>
              </select>
            </label>
          </>
        )}

        {onLoadExample && (
          <ExamplesPicker onLoadExample={onLoadExample} />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!isDirty}
          title="Save file"
        >
          💾 Save
        </Button>

        <div className="editor-toolbar-divider" />

        <Button variant="ghost" size="sm" onClick={onUndo} title="Undo">
          ↶ Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} title="Redo">
          ↷ Redo
        </Button>

        <div className="editor-toolbar-divider" />

        <Button
          variant="primary"
          size="sm"
          onClick={onValidate}
          disabled={isValidating}
          title="Validate context"
        >
          {isValidating ? (
            <>
              <LoadingSpinner size="sm" />
              Validating...
            </>
          ) : (
            "✓ Validate"
          )}
        </Button>
      </div>
    </div>
  );
};
