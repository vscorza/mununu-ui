/**
 * CompositionEditor — author the compositional-extraction config block.
 *
 * Renders a JSON editor for the composition section of the extract config,
 * with live validation and a preview of the resolved instances + shared
 * labels. Authored in the `compose` workflow step (software domain).
 *
 * The composition shape (mirrors the backend's `CompositionConfig`):
 *   {
 *     "type": "asynchronous" | "synchronous",
 *     "name": "<id>",
 *     "instances": [{ "of": "<class>", "as": "<instance_name>" }, ...],
 *     "shared": ["<label>", ...]
 *   }
 *
 * The user supplies this JSON; downstream the `extract` step merges it
 * into the extract config it sends to `POST /api/v1/extraction/extract`.
 */

import { useCallback, useMemo } from "react";

interface CompositionInstance {
  of: string;
  as: string;
}

interface CompositionShape {
  type?: string;
  name?: string;
  instances?: CompositionInstance[];
  shared?: string[];
}

interface CompositionEditorProps {
  /** Current composition config JSON, or null for empty. */
  content: string | null;
  /** Called when content changes (caller is responsible for store updates). */
  onChange: (content: string) => void;
  /** Whether the editor is read-only. */
  readOnly?: boolean;
}

const DEFAULT_TEMPLATE = JSON.stringify(
  {
    type: "asynchronous",
    name: "race",
    instances: [
      { of: "Worker", as: "worker_a" },
      { of: "Worker", as: "worker_b" },
    ],
    shared: ["ev_save"],
  },
  null,
  2,
);

interface ValidationResult {
  ok: boolean;
  parsed: CompositionShape | null;
  error: string | null;
}

function validate(json: string): ValidationResult {
  if (!json.trim()) {
    return { ok: false, parsed: null, error: "Empty config" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, parsed: null, error: `JSON parse error: ${msg}` };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, parsed: null, error: "Top-level must be an object" };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.type !== undefined && obj.type !== "asynchronous" && obj.type !== "synchronous") {
    return {
      ok: false,
      parsed: null,
      error: `\`type\` must be "asynchronous" or "synchronous"`,
    };
  }
  if (obj.instances !== undefined && !Array.isArray(obj.instances)) {
    return { ok: false, parsed: null, error: "`instances` must be an array" };
  }
  if (Array.isArray(obj.instances)) {
    for (let i = 0; i < obj.instances.length; i++) {
      const inst = obj.instances[i];
      if (typeof inst !== "object" || inst === null) {
        return {
          ok: false,
          parsed: null,
          error: `instances[${i}] must be an object`,
        };
      }
      const i_obj = inst as Record<string, unknown>;
      if (typeof i_obj.of !== "string" || !i_obj.of) {
        return {
          ok: false,
          parsed: null,
          error: `instances[${i}].of must be a non-empty string (class name)`,
        };
      }
      if (typeof i_obj.as !== "string" || !i_obj.as) {
        return {
          ok: false,
          parsed: null,
          error: `instances[${i}].as must be a non-empty string (instance name)`,
        };
      }
    }
  }
  if (
    obj.shared !== undefined &&
    (!Array.isArray(obj.shared) || obj.shared.some((s) => typeof s !== "string"))
  ) {
    return {
      ok: false,
      parsed: null,
      error: "`shared` must be an array of strings",
    };
  }
  return { ok: true, parsed: obj as CompositionShape, error: null };
}

export function CompositionEditor({
  content,
  onChange,
  readOnly = false,
}: CompositionEditorProps) {
  const validation = useMemo(
    () => validate(content ?? ""),
    [content],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleStartFromTemplate = useCallback(() => {
    onChange(DEFAULT_TEMPLATE);
  }, [onChange]);

  const showTemplate = !content || !content.trim();

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Declare instances + shared labels for compositional verification.
        See{" "}
        <a
          href="https://github.com/vscorza/mununu/wiki/Compositional-Extraction"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-600 dark:hover:text-blue-400"
        >
          Compositional Extraction wiki
        </a>{" "}
        for the full schema and semantics.
      </div>

      {showTemplate && !readOnly && (
        <button
          type="button"
          onClick={handleStartFromTemplate}
          aria-label="Start from a 2-instance race-detection template"
          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
          className="rounded-md px-3 py-1.5 text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Start from template (2-instance race)
        </button>
      )}

      <textarea
        value={content ?? ""}
        onChange={handleChange}
        readOnly={readOnly}
        spellCheck={false}
        rows={14}
        aria-label="Composition config JSON"
        placeholder='{ "type": "asynchronous", "name": "race", "instances": [...], "shared": [...] }'
        className="w-full rounded-md border border-gray-200 bg-white p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      {content && content.trim() && !validation.ok && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {validation.error}
        </div>
      )}

      {validation.ok && validation.parsed && (
        <CompositionSummary shape={validation.parsed} />
      )}
    </div>
  );
}

function CompositionSummary({ shape }: { shape: CompositionShape }) {
  const instances = shape.instances ?? [];
  const shared = shape.shared ?? [];

  return (
    <div className="rounded-md bg-green-50 p-3 text-sm dark:bg-green-900/20">
      <div className="font-medium text-green-800 dark:text-green-300">
        Valid composition
      </div>
      <div className="mt-1 text-xs text-green-700 dark:text-green-400">
        <div>
          <span className="font-medium">Type:</span> {shape.type ?? "(unset)"} ·{" "}
          <span className="font-medium">Name:</span> {shape.name ?? "(unset)"}
        </div>
        <div className="mt-1">
          <span className="font-medium">Instances ({instances.length}):</span>{" "}
          {instances.length > 0
            ? instances.map((i) => `${i.as} (of ${i.of})`).join(", ")
            : "—"}
        </div>
        <div className="mt-1">
          <span className="font-medium">Shared labels ({shared.length}):</span>{" "}
          {shared.length > 0 ? shared.join(", ") : "— (full async, no synchronization)"}
        </div>
      </div>
    </div>
  );
}
