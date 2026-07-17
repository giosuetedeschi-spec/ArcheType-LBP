import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "@tanstack/react-router"; // Usiamo il tuo router ufficiale per un cambio pagina pulito

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

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-slate-800" />
        {t("auth.orContinueWith") || "Oppure continua con"}
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-4 space-y-2">
        {/* Steam rimane disabilitato */}
        <button
          type="button"
          disabled
          title={t("auth.comingSoon")}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
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