import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import OAuthButtons from "../components/OAuthButtons";
import PasswordInput from "../components/PasswordInput";
import type { LoginPayload } from "@/types/api";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginPayload>({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Errore dal redirect di SteamAuthController.callback (login Steam fallito
  // — vedi anche OAuthCallbackPage, che rimanda qui con ?error=...). Letto
  // una sola volta al montaggio, poi ripulito dall'URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError(t("auth.loginError"));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [t]);

  // Se utente gia autenticato, redirect alla home
  if (isAuthenticated) return <Navigate to="/" />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form, rememberMe);
      navigate({ to: "/" });
    } catch (err) {
      // isAxiosError() stringe il tipo di `err` (unknown in un blocco catch)
      // in modo sicuro, stesso pattern usato in RegisterPage.tsx.
      const message = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setError(message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    // 1. Contenitore principale a schermo intero con l'immagine di sfondo impostata tramite CSS inline
    /* DOPO */
<div
  className="relative min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] w-full flex items-center justify-center bg-cover bg-center bg-no-repeat py-12 px-4"
  style={{
    backgroundImage: "url('/register-bg.webp')",
  }}
>
      {/* 2. OVERLAY: Copre tutto lo sfondo con il colore #272727 e trasparenza all'80% (0.8) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: "rgba(39, 39, 39, 0.8)" // #272727 in RGB è (39, 39, 39) con opacità 0.8
        }}
      />

      {/* 3. Il modulo di login (z-10 per stare sopra l'overlay) */}
      <div className="relative z-10 max-w-md w-full mx-auto animate-fade-in-up">
        <div
          className="bg-vz-charcoal border-[3px] border-[#E1F16B] rounded-2xl p-8 shadow-2xl"
          style={{
            // Stesso effetto neon della pagina di registrazione (blur 20px)
            boxShadow: "0 0 20px #E1F16B, inset 0 0 10px rgba(225, 241, 107, 0.5)"
          }}
        >
          <div className="flex items-center justify-center mb-1">
            <Logo className="text-2xl" variant="text" />
          </div>
          <h1 className="text-xl font-display font-bold text-white mb-1 text-center">{t("auth.loginTitle")}</h1>
          <p className="text-sm text-slate-400 mb-6 text-center">{t("auth.loginSubtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder={t("auth.usernamePlaceholder")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full bg-vz-charcoal border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
            />
            <PasswordInput
              placeholder={t("auth.passwordPlaceholder")}
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              required
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-vz-charcoal text-vz-lime focus:ring-vz-lime cursor-pointer"
              />
              <span className="text-sm text-zinc-300">{t("auth.rememberMe")}</span>
            </label>

            {error && <p className="text-vz-pink text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vz-lime text-vz-navy font-semibold rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? t("auth.loggingIn") : t("auth.loginButton")}
            </button>
          </form>

          <OAuthButtons />

          <p className="text-sm text-slate-400 mt-6 text-center">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="text-vz-lime hover:underline">
              {t("auth.registerHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
