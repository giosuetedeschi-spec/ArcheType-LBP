import { useTranslation } from "react-i18next";

// Provider OAuth non ancora implementato lato backend (vedi
// docs/auth-steam-google.md, design non ancora costruito) - bottoni
// disabilitati/placeholder per il mockup di #102, in attesa del lavoro
// backend necessario (Spring Security OAuth2 + Steam OpenID + Google).
export default function OAuthButtons() {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-zinc-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-zinc-800" />
        {t("auth.orContinueWith")}
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          disabled
          title={t("auth.comingSoon")}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
        >
          🎮 {t("auth.continueWithSteam")}
        </button>
        <button
          type="button"
          disabled
          title={t("auth.comingSoon")}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-vz-charcoal px-4 py-2.5 text-sm font-medium text-zinc-300 opacity-50 cursor-not-allowed"
        >
          🔍 {t("auth.continueWithGoogle")}
        </button>
      </div>
    </div>
  );
}
