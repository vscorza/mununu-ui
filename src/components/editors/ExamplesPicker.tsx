import { useState, useEffect, useRef } from "react";
import { Button } from "../common/Button";

interface ExampleEntry {
  name: string;
  category: string;
  path: string;
  format?: string; // "xstate", "systemverilog" — absent for CTXDSL
}

interface ExamplesPickerProps {
  onLoadExample: (content: string, fileName: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  examples: "Examples",
  property_examples: "Property Examples",
  tutorial: "Tutorial",
  adapter_examples: "Adapter Formats",
};

const FORMAT_BADGES: Record<string, string> = {
  agentic: "Agentic",
  xstate: "XState",
  systemverilog: "SV",
};

export const ExamplesPicker = ({ onLoadExample }: ExamplesPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<ExampleEntry[]>([]);
  const [loading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Fetch manifest on first open
  useEffect(() => {
    if (!isOpen || entries.length > 0) return;
    let cancelled = false;
    fetch("/examples/index.json")
      .then((res) => res.json())
      .then((data: ExampleEntry[]) => {
        if (!cancelled) {
          setEntries(data);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, entries.length]);

  const handleSelect = async (entry: ExampleEntry) => {
    try {
      const res = await fetch(`/examples/${entry.path}`);
      const text = await res.text();
      const fileName = entry.path.split("/").pop() || "example.ctxdsl";
      onLoadExample(text, fileName);
      setIsOpen(false);
    } catch {
      // silently fail
    }
  };

  // Group by category
  const grouped = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = [];
      acc[entry.category].push(entry);
      return acc;
    },
    {} as Record<string, ExampleEntry[]>,
  );

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Load example"
      >
        Examples
      </Button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            minWidth: 260,
            maxHeight: 400,
            overflowY: "auto",
            background: "var(--bg-primary, #fff)",
            border: "1px solid var(--color-border, #e5e7eb)",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: "0.25rem 0",
          }}
        >
          {loading && (
            <div style={{ padding: "0.75rem", fontSize: "0.8125rem", color: "#6b7280" }}>
              Loading...
            </div>
          )}
          {!loading &&
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div
                  style={{
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "#9ca3af",
                    letterSpacing: "0.05em",
                  }}
                >
                  {CATEGORY_LABELS[category] || category}
                </div>
                {items.map((entry) => (
                  <button
                    key={entry.path}
                    onClick={() => handleSelect(entry)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.375rem 0.75rem",
                      fontSize: "0.8125rem",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "inherit",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--hover-bg, #f3f4f6)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                      {entry.name}
                    {entry.format && FORMAT_BADGES[entry.format] && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: "0.625rem",
                          padding: "1px 4px",
                          borderRadius: 3,
                          background: "var(--color-accent-muted, #e0e7ff)",
                          color: "var(--color-accent, #4f46e5)",
                          fontWeight: 600,
                        }}
                      >
                        {FORMAT_BADGES[entry.format]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          {!loading && entries.length === 0 && (
            <div style={{ padding: "0.75rem", fontSize: "0.8125rem", color: "#6b7280" }}>
              No examples found. Run scripts/sync-examples.sh
            </div>
          )}
        </div>
      )}
    </div>
  );
};
