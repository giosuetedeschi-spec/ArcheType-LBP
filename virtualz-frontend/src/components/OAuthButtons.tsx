import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";

// Steam: implementato (docs/OAUTH_LOGIN_PLAN.md, issue #102) — redirect a
// pagina intera verso il backend, che gestisce l'intero giro OpenID 2.0 con
// Steam e torna su /oauth-callback con un token già pronto (vedi
// SteamAuthController lato backend, OAuthCallbackPage lato frontend).
// Google: non ancora implementato lato backend — bottone resta placeholder.
export default function OAuthButtons() {
  const { t } = useTranslation();

  function handleSteamLogin() {
    window.location.href = `${API_BASE_URL}/auth/steam/login`;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-slate-800" />
        {t("auth.orContinueWith")}
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={handleSteamLogin}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a475e] transition-colors"
        >
          🎮 {t("auth.continueWithSteam")}
        </button>
        <button
          type="button"
          disabled
          title={t("auth.comingSoon")}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-vz-charcoal px-4 py-2.5 text-sm font-medium text-slate-300 opacity-50 cursor-not-allowed"
        >
          🔍 {t("auth.continueWithGoogle")}
        </button>
      </div>
    </div>
  );
}
