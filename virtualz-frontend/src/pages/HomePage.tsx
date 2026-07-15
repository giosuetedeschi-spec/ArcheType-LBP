/**
 * HomePage - Main landing page for VirtualZ
 * 
 * Structure:
 * 1. HeroSection: Full-screen video background with CTA
 * 2. GameCarousels: Horizontal scrollable lists filtered by genre
 * 3. Features: Core platform capabilities (Catalog, Library, Stats)
 * 4. StatsOverview: User statistics summary (requires authentication)
 * 5. Featured: Latest games from the catalog
 * 
 * @requires HeroSection, GameCarousel, GameCard components
 * @requires TanStack Query for data fetching
 */

import { Link } from "@tanstack/react-router";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getLibrary } from "../services/libraryApi";
import { searchCatalog } from "../services/gamesApi";
import GameCard from "../components/GameCard";
import HeroSection from "../components/HeroSection";
import GameCarousel from "../components/GameCarousel";

// Genres to display in the home page carousels
// Keys must match the backend genre strings exactly
const HOME_GENRES = [
  { key: "Action", labelKey: "genres.action" },
  { key: "Adventure", labelKey: "genres.adventure" },
  { key: "RPG", labelKey: "genres.rpg" },
  { key: "Strategy", labelKey: "genres.strategy" },
  { key: "Indie", labelKey: "genres.indie" },
  { key: "Horror", labelKey: "genres.horror" },
];

export default function HomePage() {
  const { t } = useTranslation();

  const { isAuthenticated, user } = useAuth();

  const { data: libraryItems } = useQuery({
    queryKey: ['library-stats', user?.id],
    queryFn: () => getLibrary(user!.id),
    enabled: !!isAuthenticated && !!user,
  });

  const userStats = {
    inProgress: libraryItems ? libraryItems.filter((i: any) => i.status === 'playing').length : 0,
    finished: libraryItems ? libraryItems.filter((i: any) => i.status === 'finished').length : 0,
    abandoned: libraryItems ? libraryItems.filter((i: any) => i.status === 'abandoned').length : 0,
  };

  // Fetch latest games for the "Featured" section. sortBy/sortDir espliciti
  // (invece di lasciare il default lato backend) per mostrare i giochi più
  // diffusi, non i primi in ordine alfabetico — vedi GameFilterRequest.java
  // per il perché "estimatedOwners" e non "rating" (privo di segnale nel
  // dataset reale).
  const { data, isLoading } = useQuery({
    queryKey: ["games", "featured"],
    queryFn: () => searchCatalog({ page: 0, size: 6, sortBy: "estimatedOwners", sortDir: "desc" }),
  });

  const games = data?.content ?? [];
  const totalGames = data?.totalElements ?? 0;

  return (
    <div className="relative">
      {/* 1. Hero Section with YouTube background */}
      <HeroSection />

      {/* 2. Genre Carousels */}
      <div className="max-w-7xl mx-auto px-4">
        {HOME_GENRES.map(({ key, labelKey }) => (
          <GameCarousel 
            key={key} 
            genre={key} 
            title={t(labelKey)} 
          />
        ))}
      </div>

      {/* 3. Core Features */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { titleKey: "home.features.catalog.title", descKey: "home.features.catalog.desc", to: "/catalog" },
            { titleKey: "home.features.library.title", descKey: "home.features.library.desc", to: isAuthenticated ? "/library" : "/login" },
            { titleKey: "home.features.stats.title", descKey: "home.features.stats.desc", to: isAuthenticated ? "/profile" : "/login" },
          ].map(({ titleKey, descKey, to }, i) => (
            <Link
              to={to}
              key={titleKey}
              className="bg-vz-charcoal/70 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-vz-lime/40 hover:-translate-y-1 transition-all block"
            >
              <span className="text-4xl font-bold text-vz-lime/50 mb-3 block font-display">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display font-semibold text-lg text-white mb-2">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t(descKey)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. User Statistics (Visible to all, populated if authenticated) */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t("stats.totalGames")} value={totalGames} color="text-vz-lime" />
          <StatCard label={t("stats.inProgress")} value={userStats?.inProgress ?? 0} color="text-blue-400" />
          <StatCard label={t("stats.finished")} value={userStats?.finished ?? 0} color="text-emerald-400" />
          <StatCard label={t("stats.abandoned")} value={userStats?.abandoned ?? 0} color="text-slate-400" />
        </div>
      </section>

      {/* 5. Featured Games */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-white">
            {t("home.featured")}
          </h2>
          <Link to="/catalog" className="text-sm font-medium text-vz-lime hover:underline">
            {t("home.seeAll")} →
          </Link>
        </div>

        {isLoading && (
          <p className="text-slate-400 text-center py-8">{t("common.loading")}</p>
        )}

        {!isLoading && games.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {games.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * StatCard - Reusable component for displaying statistics
 * @param label - Text label for the stat
 * @param value - Numeric value to display
 * @param color - Tailwind text color class
 */
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-vz-charcoal/70 border border-slate-800 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}