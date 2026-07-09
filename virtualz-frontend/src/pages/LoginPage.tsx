import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import OAuthButtons from "../components/OAuthButtons";
import type { LoginPayload } from "@/types/api";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginPayload>({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
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
    <div className="max-w-md mx-auto mt-16 px-4 animate-fade-in-up">
      <div className="bg-vz-charcoal/60 backdrop-blur border border-zinc-800 rounded-2xl p-8">
        <div className="flex items-center justify-center mb-1">
          <Logo className="text-2xl" />
        </div>
        <h1 className="text-xl font-display font-bold text-white mb-1 text-center">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-zinc-400 mb-6 text-center">{t("auth.loginSubtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("auth.usernamePlaceholder")}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            className="w-full bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
          />
          <input
            type="password"
            placeholder={t("auth.passwordPlaceholder")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
          />

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

        <p className="text-sm text-zinc-400 mt-6 text-center">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-vz-lime hover:underline">
            {t("auth.registerHere")}
          </Link>
        </p>
      </div>
    </div>
  );
}
