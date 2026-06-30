import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useColorblind } from "../context/ColorblindContext";
import Logo from "./Logo";

// Navbar — barra di navigazione fissa in alto, presente su tutte le pagine
// (montata una sola volta in routes/__root.tsx, fuori dall'<Outlet />)
export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode, MODES } = useColorblind();
  const navigate = useNavigate();

  // Logout: pulisce sessione/token e riporta l'utente al login
  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="bg-vz-charcoal/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-20">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo + payoff, sempre cliccabile verso la home */}
        <Link to="/" className="flex flex-col items-start group">
          <Logo className="text-xl group-hover:scale-105 transition-transform" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 -mt-1">
            {t("nav.tagline")}
          </span>
        </Link>

        {/* Menu di navigazione principale — sempre visibile, indipendentemente dal login */}
        <div className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-zinc-300 hover:text-vz-lime transition-colors">
            {t("nav.home")}
          </Link>
          <Link to="/catalog" className="text-zinc-300 hover:text-vz-lime transition-colors">
            {t("nav.catalog")}
          </Link>
          <Link to="/library" className="text-zinc-300 hover:text-vz-lime transition-colors">
            {t("nav.library")}
          </Link>
          <Link to="/library" search={{ status: "WISHLIST" }} className="text-zinc-300 hover:text-vz-pink transition-colors">
            {t("nav.wishlist")}
          </Link>
          <Link to="/leaderboard" className="text-zinc-300 hover:text-vz-lime transition-colors">
            {t("nav.leaderboard")}
          </Link>
          <Link to="/friends" className="text-zinc-300 hover:text-vz-lime transition-colors">
            {t("nav.friends")}
          </Link>
        </div>

        {/* Controlli a destra: accessibilità, lingua, sessione utente */}
        <div className="flex items-center gap-4">

          {/* Selettore colorblind — cambia data-colorblind su <html>, letto da index.css */}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-vz-charcoal border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-vz-lime"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>{t(`colorblind.${m}`)}</option>
            ))}
          </select>

          <LanguageSwitcher />

          {/* Stato sessione: profilo+logout se loggata, login+registrati se no */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-sm text-zinc-400 hover:text-vz-lime hidden sm:inline transition-colors">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:border-vz-pink hover:text-vz-pink transition-colors"
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm px-3 py-1.5 rounded-full text-zinc-300 hover:text-vz-lime transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-1.5 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
