interface FormulaPreviewProps {
  formula: string;
}

export function FormulaPreview({ formula }: FormulaPreviewProps) {
  if (!formula) return null;

  const hasUnresolved = formula.includes("${");

  return (
    <div className="formula-preview">
      <label className="formula-preview__label">Formula preview:</label>
      <code
        className={`formula-preview__code${hasUnresolved ? " formula-preview__code--incomplete" : ""}`}
      >
        {formula}
      </code>
    </div>
  );
}
