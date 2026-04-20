import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../appStore";

describe("appStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to defaults
    useAppStore.setState({
      theme: "dark",
      language: "en",
    });
  });

  it("has dark theme as default", () => {
    expect(useAppStore.getState().theme).toBe("dark");
  });

  it("toggles theme from dark to light", () => {
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("toggles theme from light to dark", () => {
    useAppStore.getState().setTheme("light");
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("sets theme and persists to localStorage", () => {
    useAppStore.getState().setTheme("light");
    expect(useAppStore.getState().theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("has en as default language", () => {
    expect(useAppStore.getState().language).toBe("en");
  });

  it("sets language and persists to localStorage", () => {
    useAppStore.getState().setLanguage("es");
    expect(useAppStore.getState().language).toBe("es");
    expect(localStorage.getItem("language")).toBe("es");
  });
});
