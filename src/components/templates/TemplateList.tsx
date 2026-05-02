import type { PropertyTemplate } from "../../types/templates";
import { TemplateCard } from "./TemplateCard";

interface TemplateListProps {
  templates: PropertyTemplate[];
  onSelect: (template: PropertyTemplate) => void;
}

export function TemplateList({ templates, onSelect }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="template-list__empty">No templates match your search.</div>
    );
  }

  return (
    <div className="template-list">
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} onSelect={onSelect} />
      ))}
    </div>
  );
}
