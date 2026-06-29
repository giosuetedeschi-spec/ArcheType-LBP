import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form);
      navigate({ to: "/" });
    } catch {
      setError(t("auth.loginError"));
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
        <h1 className="text-xl font-display font-bold text-white mb-6 text-center">{t("auth.loginTitle")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder={t("auth.usernameOrEmail")}
          value={form.usernameOrEmail}
          onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
          required
          className="w-full bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
        />
        <input
          type="password"
          placeholder={t("auth.password")}
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
          {t("auth.loginButton")}
        </button>
      </form>

      <p className="text-sm text-zinc-400 mt-4 text-center">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="text-vz-lime hover:underline">
          {t("nav.register")}
        </Link>
      </p>
      </div>
    </div>
  );
}
