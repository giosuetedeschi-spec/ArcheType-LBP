import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
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
  const { persistSession } = useAuth(); // Recuperiamo la funzione ufficiale dal contesto
  const navigate = useNavigate();

  // URL del nostro backend Docker (porta 8080)
  const API_BASE_URL = "http://localhost:8080";

  const handleGoogleLogin = async () => {
    try {
      // 1. Chiamiamo l'endpoint di mock sul backend
      const response = await axios.get(`${API_BASE_URL}/api/auth/mock-google`);
      
      if (response.data && response.data.data) {
        // response.data.data corrisponde esattamente al tuo AuthResponse (contiene token, userId, username, email)
        const authResponse = response.data.data;
        
        // 2. Salva la sessione usando le REGOLE REALI del tuo progetto (impostiamo remember su true)
        persistSession(authResponse, true);
        
        alert("Accesso simulato con Google riuscito!");
        
        // 3. Reindirizziamo alla Home usando il router nativo di TanStack
        navigate({ to: "/" });
      }
    } catch (error) {
      console.error("Errore durante il mock login con Google:", error);
      alert("Impossibile connettersi al mock di Google");
    }
  };

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
          🎮 {t("auth.continueWithSteam") || "Continua con Steam"}
        </button>

        {/* GOOGLE ORA INTEGRATO INTEGRALMENTE CON L'AUTH CONTEXT! */}
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