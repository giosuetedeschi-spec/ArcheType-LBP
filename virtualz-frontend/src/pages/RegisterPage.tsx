import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import OAuthButtons from "../components/OAuthButtons";
import PasswordInput from "../components/PasswordInput";
import type { RegisterPayload } from "@/types/api";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterPayload>({ username: "", email: "", password: "" });
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Se utente gia autenticato, redirect alla home
  if (isAuthenticated) return <Navigate to="/" />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Guard esplicita oltre al disabled sul bottone: un submit via invio
    // da tastiera su un campo di testo può comunque attivare il form anche
    // se il bottone è disabled, quindi il blocco reale va fatto qui.
    if (!ageConfirmed) {
      setError(t("auth.ageRequired"));
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate({ to: "/" });
    } catch (err) {
      // `err` è tipizzato `unknown` in un blocco catch (comportamento TS
      // standard): isAxiosError() è un type guard che stringe il tipo in modo
      // sicuro, invece di un cast/any che aggirerebbe il controllo.
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    // 1. Contenitore principale a schermo intero con l'immagine di sfondo impostata tramite CSS inline
    <div 
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat py-12 px-4"
      style={{ 
        backgroundImage: "url('/register-bg.webp')", // Carica l'immagine dalla cartella public
      }}
    >
      {/* 2. OVERLAY: Copre tutto lo sfondo con il colore #272727 e trasparenza all'80% (0.8) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          backgroundColor: "rgba(39, 39, 39, 0.8)" // #272727 in RGB è (39, 39, 39) con opacità 0.8
        }}
      />

      {/* 3. Il modulo di registrazione (z-10 per stare sopra l'overlay) */}
      <div className="relative z-10 max-w-md w-full mx-auto animate-fade-in-up">
        <div 
          className="bg-vz-charcoal border-[3px] border-[#E1F16B] rounded-2xl p-8 shadow-2xl"
          style={{
          // Applica l'effetto neon basato sui dati di Figma (blur 20px)
          // Usiamo sia un'ombra esterna che una interna (inset) per rendere il neon ultra-realistico
            boxShadow: "0 0 20px #E1F16B, inset 0 0 10px rgba(225, 241, 107, 0.5)"
          }}
        >
          <div className="flex items-center justify-center mb-1">
            <Logo className="text-2xl" variant="text" />
          </div>
          <h1 className="text-xl font-display font-bold text-white mb-6 text-center">
            {t("auth.registerTitle")}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder={t("auth.username")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
              className="w-full bg-vz-charcoal border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
            />
            <input
              type="email"
              placeholder={t("auth.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-vz-charcoal border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
            />
            <PasswordInput
              placeholder={t("auth.password")}
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              required
              minLength={8}
            />

            <label className="flex items-start gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-vz-charcoal text-vz-lime focus:ring-vz-lime cursor-pointer"
              />
              <span>{t("auth.ageConfirm")}</span>
            </label>

            {error && <p className="text-vz-pink text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !ageConfirmed}
              className="w-full bg-vz-lime text-vz-navy font-semibold rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {t("auth.registerButton")}
            </button>
          </form>

          <OAuthButtons />

          <p className="text-sm text-slate-400 mt-6 text-center">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="text-vz-lime hover:underline">
              {t("nav.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
