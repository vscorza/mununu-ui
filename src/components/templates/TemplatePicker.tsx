import { useState, useCallback, useMemo } from "react";
import { useTemplates } from "../../hooks/useTemplates";
import type {
  PropertyTemplate,
  TemplateDomain,
  TemplateRef,
} from "../../types/templates";
import { TemplateList } from "./TemplateList";
import { TemplateArgForm } from "./TemplateArgForm";
import { FormulaPreview } from "./FormulaPreview";
import "./TemplatePicker.css";

interface TemplatePickerProps {
  /** Current domain for filtering (e.g., "game", "rtl"). */
  domain?: TemplateDomain;
  /** Called when user confirms a template selection with args. */
  onSelect: (ref: TemplateRef, formulaPreview: string) => void;
  /** Called when user cancels / clears template selection. */
  onClear?: () => void;
}

/**
 * Template picker: domain-filtered list + argument form + formula preview.
 *
 * Usage in verification tab:
 * ```tsx
 * <TemplatePicker domain="game" onSelect={(ref, formula) => { ... }} />
 * ```
 */
export function TemplatePicker({
  domain,
  onSelect,
  onClear,
}: TemplatePickerProps) {
  const { catalog, isLoading, error, getForDomain, preview } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] =
    useState<PropertyTemplate | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const templates = useMemo(() => {
    const all = domain ? getForDomain(domain) : catalog?.templates ?? [];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (t) =>
        t.id.includes(q) ||
        t.display_name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q)),
    );
  }, [domain, getForDomain, catalog, searchQuery]);

  const formulaPreview = useMemo(() => {
    if (!selectedTemplate) return "";
    return preview(selectedTemplate, args);
  }, [selectedTemplate, args, preview]);

  const handleSelectTemplate = useCallback((template: PropertyTemplate) => {
    setSelectedTemplate(template);
    // Initialize args with defaults
    const defaults: Record<string, string> = {};
    for (const param of template.params) {
      if (param.default) {
        defaults[param.name] = param.default;
      }
    }
    setArgs(defaults);
  }, []);

  const handleArgChange = useCallback(
    (paramName: string, value: string) => {
      setArgs((prev) => ({ ...prev, [paramName]: value }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    if (!selectedTemplate) return;
    const ref: TemplateRef = {
      template: selectedTemplate.id,
      args: { ...args },
    };
    // Remove empty optional args
    for (const param of selectedTemplate.params) {
      if (!param.required && !args[param.name]) {
        delete ref.args[param.name];
      }
    }
    onSelect(ref, formulaPreview);
  }, [selectedTemplate, args, formulaPreview, onSelect]);

  const handleBack = useCallback(() => {
    setSelectedTemplate(null);
    setArgs({});
  }, []);

  const canApply = useMemo(() => {
    if (!selectedTemplate) return false;
    return selectedTemplate.params
      .filter((p) => p.required)
      .every((p) => args[p.name]?.trim());
  }, [selectedTemplate, args]);

  if (isLoading) {
    return <div className="template-picker__loading">Loading templates...</div>;
  }

  if (error) {
    return <div className="template-picker__error">Error: {error}</div>;
  }

  // Phase 2: show argument form for selected template
  if (selectedTemplate) {
    return (
      <div className="template-picker">
        <div className="template-picker__header">
          <button
            className="template-picker__back"
            onClick={handleBack}
            title="Back to template list"
          >
            &larr;
          </button>
          <span className="template-picker__selected-name">
            {selectedTemplate.display_name}
          </span>
        </div>
        <p className="template-picker__selected-desc">
          {selectedTemplate.description}
        </p>

        {selectedTemplate.params.length > 0 && (
          <TemplateArgForm
            params={selectedTemplate.params}
            args={args}
            onChange={handleArgChange}
            domainHints={
              domain ? selectedTemplate.domain_hints[domain] : undefined
            }
          />
        )}

        <FormulaPreview formula={formulaPreview} />

        <div className="template-picker__actions">
          <button
            className="template-picker__apply"
            onClick={handleApply}
            disabled={!canApply}
          >
            Apply Template
          </button>
          {onClear && (
            <button className="template-picker__clear" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>
    );
  }

  // Phase 1: show template list
  return (
    <div className="template-picker">
      <div className="template-picker__search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="template-picker__search-input"
        />
      </div>
      <TemplateList
        templates={templates}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}
