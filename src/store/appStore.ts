import { create } from "zustand";

import type { Language } from "../i18n";

interface AppState {
  // Theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;

  // Language
  language: Language;
  setLanguage: (language: Language) => void;

}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  theme: (localStorage.getItem("theme") as "light" | "dark") || "dark",
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return { theme: newTheme };
    }),

  // Language
  language: (localStorage.getItem("language") as Language) || "en",
  setLanguage: (language) => {
    localStorage.setItem("language", language);
    set({ language });
  },

}));
