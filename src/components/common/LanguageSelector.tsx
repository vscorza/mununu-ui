import { useAppStore } from "../../store/appStore";
import type { Language } from "../../i18n";
import "./LanguageSelector.css";

const languages: Array<{ code: Language; name: string; flag: string }> = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

export const LanguageSelector = () => {
  const { language, setLanguage } = useAppStore();

  return (
    <div className="language-selector">
      <select
        className="language-selector-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
