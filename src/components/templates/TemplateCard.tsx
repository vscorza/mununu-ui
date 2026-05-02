import type { PropertyTemplate } from "../../types/templates";

interface TemplateCardProps {
  template: PropertyTemplate;
  onSelect: (template: PropertyTemplate) => void;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const paramSummary =
    template.params.length > 0
      ? `(${template.params.map((p) => `$${p.name}`).join(", ")})`
      : "";

  return (
    <button
      className="template-card"
      onClick={() => onSelect(template)}
      title={template.formula_pattern}
    >
      <div className="template-card__header">
        <span className="template-card__name">
          {template.id}
          {paramSummary && (
            <span className="template-card__params">{paramSummary}</span>
          )}
        </span>
        <span className={`template-card__kind template-card__kind--${template.kind}`}>
          {template.kind}
        </span>
      </div>
      <p className="template-card__description">{template.description}</p>
      {template.tags.length > 0 && (
        <div className="template-card__tags">
          {template.tags.map((tag) => (
            <span key={tag} className="template-card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
