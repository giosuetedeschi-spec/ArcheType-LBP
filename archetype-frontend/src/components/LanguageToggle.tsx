import { useI18n } from "@/i18n/I18nContext";
import { Globe } from "lucide-react";

const LANGS = [
  { value: "en", label: "EN" },
  { value: "it", label: "IT" },
  { value: "fr", label: "FR" },
] as const;

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs focus:border-brand focus:outline-none"
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
