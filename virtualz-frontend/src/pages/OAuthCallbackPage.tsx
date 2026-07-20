import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

/**
 * Destinazione del redirect a fine login Steam (vedi
 * SteamAuthController.callback() lato backend). Non è mai raggiunta
 * direttamente dall'utente — solo tramite il redirect a pagina intera dopo
 * l'autenticazione su Steam — quindi non ha una UI vera, solo uno stato di
 * caricamento durante l'istante in cui apre la sessione e reindirizza.
 *
 * token/userId/username arrivano già pronti nella query string (non serve
 * una chiamata API "chi sono?" in più) — vedi AuthContext.completeOAuthLogin.
 */
export default function OAuthCallbackPage() {
  const { t } = useTranslation();
  const { completeOAuthLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("userId");
    const username = params.get("username");

    if (token && userId && username) {
      completeOAuthLogin({ token, userId: Number(userId), username }, true);
      navigate({ to: "/" });
    } else {
      // Redirect di errore (es. verifica Steam fallita) — vedi
      // SteamAuthController per i codici di errore possibili. window.location
      // invece del router: /login non ha uno schema di search param tipizzato
      // per un caso limite come questo.
      window.location.href = "/login?error=" + (params.get("error") ?? "steam_verification_failed");
    }
  }, [completeOAuthLogin, navigate]);

  return <p className="text-slate-400 text-center mt-16">{t("common.loading")}</p>;
}
