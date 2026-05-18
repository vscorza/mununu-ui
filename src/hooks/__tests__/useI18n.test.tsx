import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useI18n } from "../useI18n";
import { useAppStore } from "../../store/appStore";

describe("useI18n", () => {
  beforeEach(() => {
    // Reset language to en before every test.
    useAppStore.setState({ language: "en" });
  });

  it("returns the English string for an existing key", () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t("common.save")).toBe("Save");
  });

  it("returns the path string and warns when the key is missing", () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.t("does.not.exist")).toBe("does.not.exist");
  });

  it("interpolates {name} placeholders from the vars map", () => {
    const { result } = renderHook(() => useI18n());
    // Use the new satisfyingOfTotal key shipped in A4.
    const out = result.current.t("extraction.verdictTable.satisfyingOfTotal", {
      satisfying: 1,
      total: 4,
    });
    expect(out).toBe("1 satisfying / 4 total");
  });

  it("leaves the placeholder in place when a variable is missing", () => {
    const { result } = renderHook(() => useI18n());
    const out = result.current.t(
      "extraction.verdictTable.satisfyingOfTotal",
      // Missing the `total` key — placeholder should stay.
      { satisfying: 1 },
    );
    expect(out).toContain("{total}");
  });

  it("switches translations when the language changes", () => {
    const { result, rerender } = renderHook(() => useI18n());
    expect(result.current.t("extraction.verdictTable.verdictSatisfied")).toBe(
      "SATISFIED",
    );
    act(() => {
      useAppStore.setState({ language: "es" });
    });
    rerender();
    expect(result.current.t("extraction.verdictTable.verdictSatisfied")).toBe(
      "SATISFECHA",
    );
    act(() => {
      useAppStore.setState({ language: "pt" });
    });
    rerender();
    expect(result.current.t("extraction.verdictTable.verdictSatisfied")).toBe(
      "SATISFEITA",
    );
  });
});
