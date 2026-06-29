import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate({ to: "/" });
    } catch (err) {
      setError(err.response?.data?.message || t("auth.registerError"));
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
        <h1 className="text-xl font-display font-bold text-white mb-6 text-center">{t("auth.registerTitle")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder={t("auth.username")}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          minLength={3}
          className="w-full bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
        />
        <input
          type="email"
          placeholder={t("auth.email")}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
        />
        <input
          type="password"
          placeholder={t("auth.password")}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
          className="w-full bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
        />

        {error && <p className="text-vz-pink text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-vz-lime text-vz-navy font-semibold rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {t("auth.registerButton")}
        </button>
      </form>

      <p className="text-sm text-zinc-400 mt-4 text-center">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="text-vz-lime hover:underline">
          {t("nav.login")}
        </Link>
      </p>
      </div>
    </div>
  );
}
