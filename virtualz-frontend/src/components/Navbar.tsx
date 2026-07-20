import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useColorblind, type ColorblindMode } from "../context/ColorblindContext";
import Logo from "./Logo";

// Navbar — barra di navigazione fissa in alto, presente su tutte le pagine
// (montata una sola volta in routes/__root.tsx, fuori dall'<Outlet />)
export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode, MODES } = useColorblind();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Logout: pulisce sessione/token e riporta l'utente al login
  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate({ to: "/login" });
  }

  // "/" fa match come prefisso di ogni rotta: activeOptions exact evita che
  // Home resti evidenziata ovunque nell'app.
  const NAV_ITEMS: { to: string; label: string; exact?: boolean }[] = [
    { to: "/", label: t("nav.home"), exact: true },
    { to: "/catalog", label: t("nav.catalog") },
    { to: "/library", label: t("nav.library") },
    { to: "/leaderboard", label: t("nav.leaderboard") },
    { to: "/friends", label: t("nav.friends") },
  ];

  const navLinks = (
    <>
      {NAV_ITEMS.map(({ to, label, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: !!exact }}
          className="pb-1 border-b-2 transition-colors"
          activeProps={{ className: "border-vz-lime text-vz-lime font-semibold" }}
          inactiveProps={{ className: "border-transparent text-slate-300 hover:text-vz-lime" }}
          onClick={() => setMenuOpen(false)}
        >
          {label}
        </Link>
      ))}
    </>
  );

  const sessionControls = (
    isAuthenticated ? (
      <div className="flex items-center gap-3 xl:gap-4">
        <Link to="/profile" className="text-sm xl:text-base text-white font-semibold hover:text-vz-lime transition-colors" onClick={() => setMenuOpen(false)}>
          {user?.username}
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm xl:text-base px-3 xl:px-4 py-1.5 xl:py-2 rounded-full border border-slate-700 text-slate-300 hover:border-vz-pink hover:text-vz-pink transition-colors"
        >
          {t("nav.logout")}
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-2 xl:gap-3">
        <Link
          to="/login"
          className="text-sm xl:text-base px-3 xl:px-4 py-1.5 xl:py-2 rounded-full text-slate-300 hover:text-vz-lime transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.login")}
        </Link>
        <Link
          to="/register"
          className="text-sm xl:text-base px-4 xl:px-5 py-1.5 xl:py-2 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
          onClick={() => setMenuOpen(false)}
        >
          {t("nav.register")}
        </Link>
      </div>
    )
  );

  return (
    <header className="bg-vz-navy-deep/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
      <nav className="max-w-7xl mx-auto px-4 xl:px-8 h-16 xl:h-20 flex items-center justify-between">

        {/* Logo + payoff, sempre cliccabile verso la home */}
        {/* Logo, sempre cliccabile verso la home */}
        <Link to="/" className="group shrink-0">
          <Logo size={64} className="group-hover:scale-105 transition-transform" />
        </Link>

        {/* Menu di navigazione principale — visibile da lg in su, indipendentemente dal login.
            justify-center invece che stretto a sinistra: su schermi larghi resta a metà
            strada tra logo e controlli invece di accalcarsi contro il primo. */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-10 text-sm xl:text-base">
          {navLinks}
        </div>

        {/* Controlli a destra: accessibilità, lingua, sessione utente — visibili da lg in su */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-5 shrink-0">

          {/* Selettore colorblind — cambia data-colorblind su <html>, letto da index.css */}
          <div className="colorblind-select-wrap" title={t("colorblind.label")}>
            <div className="flex items-center gap-1.5 bg-vz-charcoal rounded-lg px-2 py-1">
              <Eye size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ColorblindMode)}
                aria-label={t("colorblind.label")}
                className="bg-transparent text-xs text-slate-300 focus:outline-none"
              >
                {MODES.map((m) => (
                  <option key={m} value={m}>{t(`colorblind.${m}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <LanguageSwitcher />

          {sessionControls}
        </div>

        {/* Hamburger — sotto lg, apre il pannello con link e controlli */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={t("nav.toggleMenu")}
          aria-expanded={menuOpen}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 text-slate-300 hover:border-vz-lime hover:text-vz-lime transition-colors"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Pannello mobile/tablet — sotto lg, mostra tutto impilato quando aperto */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-800 px-4 py-4 space-y-4">
          <div className="flex flex-col gap-3 text-sm">
            {navLinks}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <div className="colorblind-select-wrap" title={t("colorblind.label")}>
              <div className="flex items-center gap-1.5 bg-vz-charcoal rounded-lg px-2 py-1">
                <Eye size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ColorblindMode)}
                  aria-label={t("colorblind.label")}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none"
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>{t(`colorblind.${m}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <LanguageSwitcher />
          </div>

          <div className="pt-2 border-t border-slate-800">
            {sessionControls}
          </div>
        </div>
      )}
    </header>
  );
}
