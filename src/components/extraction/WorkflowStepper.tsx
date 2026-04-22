import {
  useExtractionStore,
  isStepAvailable,
  getStepStatus,
} from "../../store/extractionStore";
import type { StepStatus } from "../../store/extractionStore";

const statusColors: Record<StepStatus, { circle: string; label: string; line: string }> = {
  pending: {
    circle: "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400",
    label: "text-gray-500 dark:text-gray-400",
    line: "bg-gray-300 dark:bg-gray-600",
  },
  active: {
    circle:
      "border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-100 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-900/50",
    label: "text-blue-700 font-semibold dark:text-blue-300",
    line: "bg-gray-300 dark:bg-gray-600",
  },
  completed: {
    circle:
      "border-green-600 bg-green-100 text-green-800 dark:border-green-400 dark:bg-green-900/40 dark:text-green-300",
    label: "text-green-700 dark:text-green-300",
    line: "bg-green-500 dark:bg-green-400",
  },
  skipped: {
    circle:
      "border-amber-500 bg-amber-100 text-amber-700 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-300",
    label: "text-amber-600 dark:text-amber-300",
    line: "bg-amber-400 dark:bg-amber-400",
  },
};

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export const WorkflowStepper = () => {
  const state = useExtractionStore();
  const { activeWorkflow, goToStep } = state;

  if (!activeWorkflow) return null;

  const steps = activeWorkflow.steps;

  return (
    <nav aria-label="Workflow steps" className="w-full py-4">
      <ol className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const status = getStepStatus(state, step.id);
          const available = isStepAvailable(state, step.id);
          const clickable = status === "completed" || (available && status !== "pending");
          const colors = statusColors[status];
          const isLast = idx === steps.length - 1;

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => clickable && goToStep(step.id)}
                  disabled={!clickable}
                  title={step.description}
                  className={`
                    flex items-center justify-center w-9 h-9 rounded-full border-2
                    transition-all duration-200 text-sm font-medium
                    ${colors.circle}
                    ${clickable ? "cursor-pointer hover:scale-110" : "cursor-default"}
                  `}
                >
                  {status === "completed" ? <CheckIcon /> : idx + 1}
                </button>
                <span
                  className={`mt-2 text-xs text-center max-w-[5rem] leading-tight ${colors.label}`}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] ${
                    status === "completed" ? colors.line : statusColors.pending.line
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
