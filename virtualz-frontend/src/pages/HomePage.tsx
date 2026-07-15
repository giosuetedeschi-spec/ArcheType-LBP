/**
 * HomePage - Main landing page for VirtualZ
 * 
 * Structure:
 * 1. HeroSection: Full-screen video background with CTA
 * 2. GameCarousels: Horizontal scrollable lists filtered by genre
 * 3. Features: Core platform capabilities (Catalog, Library, Stats) + catalog size, 2x2 grid
 * 4. Featured: Latest games from the catalog
 * 
 * @requires HeroSection, GameCarousel, GameCard components
 * @requires TanStack Query for data fetching
 */

import { Link } from "@tanstack/react-router";
import { Gamepad2, Heart, BarChart3, Library } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
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
  const { isAuthenticated } = useAuth();

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

      {/* 3. Core Features + catalog size, in a single 2x2 grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { Icon: Gamepad2, titleKey: "home.features.catalog.title", descKey: "home.features.catalog.desc" },
            { Icon: Heart, titleKey: "home.features.library.title", descKey: "home.features.library.desc" },
            { Icon: BarChart3, titleKey: "home.features.stats.title", descKey: "home.features.stats.desc" },
          ].map(({ Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="bg-vz-charcoal/70 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-vz-lime/40 hover:-translate-y-1 transition-all"
            >
              <Icon className="h-8 w-8 mb-3 text-vz-lime" />
              <h3 className="font-display font-semibold text-lg text-white mb-2">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          ))}
          <div className="bg-vz-charcoal/70 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-vz-lime/40 hover:-translate-y-1 transition-all">
            <Library className="h-8 w-8 mb-3 text-vz-lime" />
            <h3 className="font-display font-semibold text-lg text-white mb-2">
              {t("stats.totalGames")}
            </h3>
            <p className="text-3xl font-display font-bold text-vz-lime">{totalGames}</p>
          </div>
        </div>
      </section>

      {/* 4. Featured Games */}
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
