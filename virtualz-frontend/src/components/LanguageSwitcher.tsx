import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../i18n";

const LABELS: Record<string, string> = { it: "Italiano", en: "English", fr: "Français", es: "Español" };

// Bandierine come SVG inline invece che emoji: le emoji-bandiera non hanno
// un font di sistema su Windows (mostrano solo il codice paese, es. "IT").
function FlagIcon({ code }: { code: string }) {
  switch (code) {
    case "it":
      return (
        <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shrink-0" aria-hidden="true">
          <rect width="1" height="2" fill="#009246" />
          <rect x="1" width="1" height="2" fill="#f4f5f0" />
          <rect x="2" width="1" height="2" fill="#ce2b37" />
        </svg>
      );
    case "fr":
      return (
        <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shrink-0" aria-hidden="true">
          <rect width="1" height="2" fill="#0055a4" />
          <rect x="1" width="1" height="2" fill="#fff" />
          <rect x="2" width="1" height="2" fill="#ef4135" />
        </svg>
      );
    case "es":
      return (
        <svg viewBox="0 0 3 2" className="w-4 h-3 rounded-sm shrink-0" aria-hidden="true">
          <rect width="3" height="2" fill="#aa151b" />
          <rect y="0.5" width="3" height="1" fill="#f1bf00" />
        </svg>
      );
    case "en":
      return (
        <svg viewBox="0 0 60 36" className="w-4 h-3 rounded-sm shrink-0" aria-hidden="true">
          <rect width="60" height="36" fill="#00247d" />
          <path d="M0 0 60 36M60 0 0 36" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 60 36M60 0 0 36" stroke="#cf142b" strokeWidth="2" />
          <path d="M30 0V36M0 18H60" stroke="#fff" strokeWidth="10" />
          <path d="M30 0V36M0 18H60" stroke="#cf142b" strokeWidth="6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectLanguage(lng: string) {
    i18n.changeLanguage(lng);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Lingua / Language"
        className="flex items-center gap-2 bg-vz-charcoal text-sm text-slate-200 rounded-full pl-3 pr-2.5 py-1.5 border border-slate-700 hover:border-vz-lime focus:outline-none focus:ring-2 focus:ring-vz-lime cursor-pointer"
      >
        <FlagIcon code={i18n.language} />
        <span>{LABELS[i18n.language]}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 w-max bg-vz-charcoal border border-slate-700 rounded-lg py-1 shadow-lg z-30"
        >
          {SUPPORTED_LANGUAGES.map((lng: string) => (
            <li key={lng} role="option" aria-selected={lng === i18n.language}>
              <button
                type="button"
                onClick={() => selectLanguage(lng)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-white/5 ${
                  lng === i18n.language ? "text-vz-lime" : "text-slate-200"
                }`}
              >
                <FlagIcon code={lng} />
                {LABELS[lng]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
