import { useTranslation } from "react-i18next";

export default function OAuthButtons() {
  const { t } = useTranslation();

  // URL del nostro backend Docker (porta 8080)
  const API_BASE_URL = "http://localhost:8080";

  const handleGoogleLogin = () => {
    // Reindirizziamo l'utente all'endpoint di autorizzazione di Spring Security
    window.location.href = `${API_BASE_URL}/api/oauth2/authorization/google`;
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-slate-800" />
        {t("auth.orContinueWith") || "Oppure continua con"}
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-4 space-y-2">
        {/* Steam rimane disabilitato fino alla sua implementazione specifica */}
        <button
          type="button"
          disabled
          title={t("auth.comingSoon")}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
        >
          🎮 {t("auth.continueWithSteam") || "Continua con Steam"}
        </button>

        {/* GOOGLE ORA ATTIVO! */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-vz-charcoal px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          🔍 {t("auth.continueWithGoogle") || "Continua con Google"}
        </button>
      </div>
    </div>
  );
}