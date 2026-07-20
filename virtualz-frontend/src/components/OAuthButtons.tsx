import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";

/**
 * Bottoni OAuth per login con provider esterni (Steam e Google).
 *
 * Al click reindirizza al backend, che gestisce il flusso di
 * autenticazione con il provider (redirect a pagina intera, mai XHR/fetch).
 * Il frontend non gestisce token OAuth direttamente — li riceve dal
 * backend dopo il redirect su /oauth-callback (vedi
 * routes/oauth-callback.tsx — gestito a mano sia per Steam che per Google,
 * SteamAuthController/GoogleAuthController, niente oauth2Login() di Spring).
 *
 * Nota: entrambi i provider richiedono segreti reali lato backend
 * (GOOGLE_CLIENT_ID/SECRET, STEAM_API_KEY) non ancora presenti in
 * docker-compose.yml — senza quelli il redirect parte ma
 * l'autenticazione con il provider fallisce.
 *
 * @see docs/auth-steam-google.md — design dell'autenticazione OAuth
 * @see docs/OAUTH_LOGIN_PLAN.md — flusso Steam (login/link)
 * @see issue #249 — loghi ufficiali bottoni OAuth
 */
export default function OAuthButtons() {
  const { t } = useTranslation();

  /** Reindirizza al backend per il flusso OAuth Steam (OpenID). */
  const handleSteam = () => { window.location.href = `${API_BASE_URL}/auth/steam/login`; };

  /** Reindirizza al backend per il flusso OAuth2 Google (gestito a mano, vedi GoogleAuthController). */
  const handleGoogle = () => { window.location.href = `${API_BASE_URL}/auth/google/login`; };

  return (
    <div className="mt-6">
      {/* Divisore "oppure continua con" */}
      <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-slate-800" />
        {t("auth.orContinueWith") || "Oppure continua con"}
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-4 space-y-2">
        {/* Bottone Steam — sfondo blu scuro brand #1b2838 */}
        <button
          type="button"
          onClick={handleSteam}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a475e] transition-colors"
        >
          <img src="https://cdn.simpleicons.org/steam/white" alt="Steam" className="h-5 w-5" />
          {t("auth.continueWithSteam") || "Continua con Steam"}
        </button>

        {/* Bottone Google — sfondo scuro coerente col tema, logo ufficiale a colori */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-vz-charcoal px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <img src="https://cdn.simpleicons.org/google" alt="Google" className="h-5 w-5" />
          {t("auth.continueWithGoogle") || "Continua con Google"}
        </button>
      </div>
    </div>
  );
}