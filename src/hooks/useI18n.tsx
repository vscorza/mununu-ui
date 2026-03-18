import { useAppStore } from "../store/appStore";
import { getTranslation, type TranslationKeys } from "../i18n";

export const useI18n = () => {
  const language = useAppStore((state) => state.language);

  const t = (path: string): string => {
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

    return typeof value === "string" ? value : path;
  };

  return {
    t,
    language,
    translations: getTranslation(language) as TranslationKeys,
  };
};
