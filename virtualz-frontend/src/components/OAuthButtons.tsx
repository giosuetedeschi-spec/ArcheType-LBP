import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { API_BASE_URL } from "../services/api";

/**
 * Bottoni OAuth per login con provider esterni (Steam e Google).
 *
 * Steam reindirizza al backend (redirect a pagina intera, flusso OpenID
 * reale — vedi SteamAuthController). Google usa per ora un endpoint di
 * mock lato backend (/api/auth/mock-google, vedi
 * docs/DOCS_MOCK_GOOGLE_AUTH.md): crea/riusa un utente finto e restituisce
 * un JWT vero, così il resto dell'app (AuthContext, rotte protette) si
 * comporta esattamente come con un login reale. Il login Google vero
 * (Authorization Code manuale, stesso pattern di Steam) è pronto ma
 * accantonato per ora in attesa di credenziali reali — vedi issue #268 —
 * per non bloccare la scadenza del 28/07 su una dipendenza esterna.
 *
 * @see docs/DOCS_MOCK_GOOGLE_AUTH.md — perché il mock Google
 * @see issue #249 — loghi ufficiali bottoni OAuth
 */
export default function OAuthButtons() {
  const { t } = useTranslation();
  const { persistSession } = useAuth();
  const navigate = useNavigate();

  /** Reindirizza al backend per il flusso OAuth Steam (OpenID). */
  const handleSteam = () => { window.location.href = `${API_BASE_URL}/auth/steam/login`; };

  /** Login Google simulato: crea/riusa un utente finto lato backend e apre la sessione come un login vero. */
  const handleGoogleLogin = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/mock-google`);

      if (response.data && response.data.data) {
        const authResponse = response.data.data;
        persistSession(authResponse, true);
        navigate({ to: "/" });
      }
    } catch (error) {
      console.error("Errore durante il mock login con Google:", error);
      alert("Impossibile connettersi al mock di Google");
    }
  };

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

        {/* Bottone Google — mock, vedi commento in cima al file */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a475e] transition-colors"
        >
          <img src="https://cdn.simpleicons.org/google" alt="Google" className="h-5 w-5" />
          {t("auth.continueWithGoogle") || "Continua con Google"}
        </button>
      </div>
    </div>
  );
}