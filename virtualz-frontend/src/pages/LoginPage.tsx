import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
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
      navigate({ to: "/" });;
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            {t("auth.login")}
          </h1>
          <p className="text-gray-300 text-center mb-8">
            {t("auth.loginSubtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                {t("auth.username")}
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder={t("auth.usernamePlaceholder")}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder={t("auth.passwordPlaceholder")}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              {t("auth.noAccount")}{" "}
              <Link
                to="/register"
                className="text-purple-400 hover:text-purple-300 font-medium transition"
              >
                {t("auth.registerHere")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
