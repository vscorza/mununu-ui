import type { TemplateParam } from "../../types/templates";

interface TemplateArgFormProps {
  params: TemplateParam[];
  args: Record<string, string>;
  onChange: (paramName: string, value: string) => void;
  /** Domain-specific hints for parameter values. */
  domainHints?: Record<string, string>;
}

export function TemplateArgForm({
  params,
  args,
  onChange,
  domainHints,
}: TemplateArgFormProps) {
  return (
    <div className="template-arg-form">
      {params.map((param) => {
        const hint = domainHints?.[param.name];
        const placeholder = hint || param.description;
        const isRequired = param.required;

        return (
          <div key={param.name} className="template-arg-form__field">
            <label className="template-arg-form__label">
              <span className="template-arg-form__param-name">
                ${param.name}
              </span>
              {!isRequired && (
                <span className="template-arg-form__optional">optional</span>
              )}
            </label>
            <input
              type={param.param_type.type === "integer" ? "number" : "text"}
              value={args[param.name] ?? ""}
              onChange={(e) => onChange(param.name, e.target.value)}
              placeholder={placeholder}
              className="template-arg-form__input"
              required={isRequired}
              min={
                param.param_type.type === "integer"
                  ? param.param_type.min
                  : undefined
              }
              max={
                param.param_type.type === "integer"
                  ? param.param_type.max
                  : undefined
              }
            />
            <span className="template-arg-form__description">
              {param.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
