import { WORKFLOW_REGISTRY } from "../../types/workflow";
import type { WorkflowDefinition } from "../../types/workflow";

interface DomainSelectorProps {
  onSelectDomain: (domain: string) => void;
  selectedDomain: string | null;
}

function DomainCard({
  workflow,
  selected,
  onClick,
}: {
  workflow: WorkflowDefinition;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        text-left rounded-lg border-2 p-5 transition-all duration-150
        hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${
          selected
            ? "border-blue-500 bg-blue-50 shadow-sm dark:border-blue-400 dark:bg-blue-900/20"
            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        }
      `}
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {workflow.displayName}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {workflow.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {workflow.sourceExtensions.map((ext) => (
          <span
            key={ext}
            className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {ext}
          </span>
        ))}
      </div>
    </button>
  );
}

export const DomainSelector = ({ onSelectDomain, selectedDomain }: DomainSelectorProps) => {
  const domains = Object.values(WORKFLOW_REGISTRY);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {domains.map((workflow) => (
        <DomainCard
          key={workflow.domain}
          workflow={workflow}
          selected={selectedDomain === workflow.domain}
          onClick={() => onSelectDomain(workflow.domain)}
        />
      ))}
    </div>
  );
};
