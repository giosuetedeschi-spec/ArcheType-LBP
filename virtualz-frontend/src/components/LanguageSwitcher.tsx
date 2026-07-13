import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";

const FLAGS: Record<string, string> = { it: "🇮🇹", en: "🇬🇧", fr: "🇫🇷", es: "🇪🇸" };
const LABELS: Record<string, string> = { it: "Italiano", en: "English", fr: "Français", es: "Español" };

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label="Lingua / Language"
      className="bg-vz-charcoal text-sm text-slate-200 rounded-full px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-vz-lime cursor-pointer"
    >
      {SUPPORTED_LANGUAGES.map((lng: string) => (
        <option key={lng} value={lng}>
          {FLAGS[lng]} {LABELS[lng]}
        </option>
      ))}
    </select>
  );
}
