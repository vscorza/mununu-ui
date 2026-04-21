/**
 * SidecarEditor — Monaco JSON editor for .mununu.json and .espec.json files.
 *
 * Provides JSON editing with optional schema validation, autocompletion,
 * and a live preview of validation errors.
 */

import { useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useAppStore } from "../../store/appStore";

interface SidecarEditorProps {
  /** Current sidecar content (JSON string). */
  content: string;
  /** Called when content changes. */
  onChange: (content: string) => void;
  /** File extension for display (e.g., ".mununu.json", ".espec.json"). */
  extension: string;
  /** Whether the editor is read-only. */
  readOnly?: boolean;
}

export function SidecarEditor({
  content,
  onChange,
  extension,
  readOnly = false,
}: SidecarEditorProps) {
  const theme = useAppStore((s) => s.theme);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {extension}
        </span>
        {readOnly && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            read-only
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="json"
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          value={content}
          onChange={handleChange}
          options={{
            readOnly,
            minimap: { enabled: false },
            lineNumbers: "on",
            fontSize: 12,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
