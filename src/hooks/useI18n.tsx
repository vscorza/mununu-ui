import { useAppStore } from "../store/appStore";
import { getTranslation, type TranslationKeys } from "../i18n";

/**
 * Substitution map for `t("key", { name: "Alice", count: "3" })`.
 * Values are stringified before interpolation; non-string callers
 * (e.g. number `3`) should pre-format. `{name}` placeholders that
 * are not present in `vars` are left in place (warns).
 */
export type I18nVars = Record<string, string | number>;

export const useI18n = () => {
  const language = useAppStore((state) => state.language);

  const t = (path: string, vars?: I18nVars): string => {
    const translation = getTranslation(language);
    const keys = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translation; // Dynamic key access requires any

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key as keyof typeof value];
      } else {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
    }

    if (typeof value !== "string") return path;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) => {
      const v = vars[name];
      if (v === undefined) {
        console.warn(`Translation variable not provided: ${name} in ${path}`);
        return match;
      }
      return String(v);
    });
  };

  return {
    t,
    language,
    translations: getTranslation(language) as TranslationKeys,
  };
};
