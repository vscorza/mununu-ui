import { Button } from "../common/Button";
import { LoadingSpinner } from "../common/LoadingSpinner";
import "./EditorToolbar.css";

interface EditorToolbarProps {
  fileName: string;
  isDirty: boolean;
  isValidating: boolean;
  onNew: () => void;
  onSave: () => void;
  onValidate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onLoadFile?: (file: File) => void;
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
}: EditorToolbarProps) => {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLoadFile) {
      onLoadFile(file);
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
          <label className="editor-toolbar-file-label">
            <input
              type="file"
              accept=".ctxdsl,.txt"
              onChange={handleFileInput}
              className="editor-toolbar-file-input"
            />
            <span className="button button-ghost button-sm" title="Open file">
              📂 Open
            </span>
          </label>
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
