import { useState, useCallback } from "react";
import { summarizeContext } from "../api/endpoints";
import { useToast } from "./useToast";
import { useErrorHandler } from "./useErrorHandler";

export type SortField = "name" | "states" | "transitions";
export type SortOrder = "asc" | "desc";

interface Automaton {
  name: string;
  states_count: number;
  transitions_count: number;
}

interface ControllerSummary {
  name: string;
  source: string;
  formula: string;
  realizable: boolean;
  states_count: number;
  transitions_count: number;
}

interface Summary {
  context_name: string;
  automata: Automaton[];
  formulas_count: number;
  controllers_count: number;
  controllers?: ControllerSummary[];
}

interface SummaryState {
  summary: Summary | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

export const useSummary = () => {
  const [state, setState] = useState<SummaryState>({
    summary: null,
    isLoading: false,
    error: null,
    lastFetched: null,
  });

  const [viewMode, setViewMode] = useState<"cards" | "table" | "json">("cards");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterText, setFilterText] = useState("");

  const toast = useToast();
  const { handleError } = useErrorHandler();

  const fetchSummary = useCallback(
    async (content: string, name?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await summarizeContext({
          context: {
            content,
            name: name || "unnamed",
          },
        });

        setState({
          summary: response.summary as Summary,
          isLoading: false,
          error: null,
          lastFetched: new Date(),
        });

        toast.showSuccess("Summary generated successfully");
      } catch (err) {
        const errorMessage = handleError(err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast.showError(`Failed to generate summary: ${errorMessage}`);
      }
    },
    [toast, handleError],
  );

  const clearSummary = useCallback(() => {
    setState({
      summary: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    });
  }, []);

  const getFilteredAndSortedAutomata = useCallback((): Automaton[] => {
    if (!state.summary) return [];

    let automata = [...state.summary.automata];

    if (filterText) {
      automata = automata.filter((a) =>
        a.name.toLowerCase().includes(filterText.toLowerCase()),
      );
    }

    automata.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "states":
          cmp = a.states_count - b.states_count;
          break;
        case "transitions":
          cmp = a.transitions_count - b.transitions_count;
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return automata;
  }, [state.summary, filterText, sortField, sortOrder]);

  const exportJSON = useCallback(() => {
    if (!state.summary) return;
    const blob = new Blob([JSON.stringify(state.summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.summary.context_name || "summary"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.summary]);

  const exportCSV = useCallback(() => {
    if (!state.summary) return;
    const header = "Name,States,Transitions\n";
    const rows = state.summary.automata
      .map((a) => `${a.name},${a.states_count},${a.transitions_count}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.summary.context_name || "summary"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.summary]);

  return {
    state,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    filterText,
    setFilterText,
    fetchSummary,
    clearSummary,
    exportJSON,
    exportCSV,
    getFilteredAndSortedAutomata,
  };
};
