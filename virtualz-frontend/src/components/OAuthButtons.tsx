import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../services/api";

/**
 * Bottoni OAuth per login con provider esterni (Steam e Google).
 *
 * Al click reindirizza al backend Spring Security OAuth2 che gestisce
 * il flusso di autenticazione con il provider. Il frontend non gestisce
 * token OAuth direttamente — li riceve dal backend dopo il redirect.
 *
 * @see docs/auth-steam-google.md — design dell'autenticazione OAuth
 * @see issue #102 — implementazione backend pendente
 */
export default function OAuthButtons() {
  const { t } = useTranslation();

  /** URL base dell'API, configurabile via variabile d'ambiente Vite. */
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  /** Reindirizza al backend per il flusso OAuth Steam (OpenID). */
  const handleSteam = () => { window.location.href = `${API_BASE}/auth/steam`; };

  /** Reindirizza al backend per il flusso OAuth Google. */
  const handleGoogle = () => { window.location.href = `${API_BASE}/auth/google`; };

  return (
    <div className="mt-6">
      {/* Divisore "oppure continua con" */}
      <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-slate-800" />
        {t("auth.orContinueWith")}
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
          Steam
        </button>

        {/* Bottone Google — sfondo bianco per rispettare le brand guidelines Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-vz-charcoal px-4 py-2.5 text-sm font-medium text-white hover:border-slate-500 transition-colors"
        >
          <img src="https://cdn.simpleicons.org/google" alt="Google" className="h-5 w-5" />
          Google
        </button>
      </div>
    </div>
  );
}