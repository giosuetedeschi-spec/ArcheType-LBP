/**
 * GameCarousel - Horizontal scrollable game list filtered by genre
 * 
 * Features:
 * - Fetches games filtered by genre via TanStack Query
 * - Horizontal scroll with prev/next navigation arrows
 * - No autoplay (per client specifications)
 * - Links to Catalog page with genre filter and individual Product pages
 * - Skeleton loading state while data is being fetched
 * 
 * @param genre - Genre filter value (e.g., "Action", "RPG")
 * @param title - Display title for the section
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import GameCard from "./GameCard";
import { searchCatalog } from "../services/gamesApi";
import type { Game } from "@/types/api";

interface GameCarouselProps {
  genre: string;
  title: string;
}

export default function GameCarousel({ genre, title }: GameCarouselProps) {
  const { t } = useTranslation();
  const [scrollIndex, setScrollIndex] = useState(0);
  const gamesPerView = 4;

  const { data, isLoading } = useQuery({
    queryKey: ["games", "genre", genre],
    queryFn: () => searchCatalog({ page: 0, size: 20, genre }),
  });

  const games: Game[] = data?.content ?? [];
  const maxIndex = Math.max(0, games.length - gamesPerView);

  const handlePrev = () => setScrollIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setScrollIndex((prev) => Math.min(maxIndex, prev + 1));

  if (isLoading) {
    return (
      <section className="py-12">
        <h2 className="text-2xl font-display font-bold text-white mb-6 px-4">{title}</h2>
        <div className="flex gap-4 px-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-64 h-80 bg-vz-charcoal rounded-xl skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center justify-between px-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-white">{title}</h2>
        <Link to="/catalog" search={{ genre }} className="text-sm text-vz-lime hover:underline">
          {t("home.seeAll")} →
        </Link>
      </div>

      <div className="relative group">
        {scrollIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-vz-charcoal/90 border border-zinc-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-vz-charcoal"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        <div className="flex gap-4 px-4 overflow-hidden">
          <div
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${scrollIndex * 272}px)` }}
          >
            {games.map((game) => (
              <div key={game.id} className="w-64 flex-shrink-0">
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </div>

        {scrollIndex < maxIndex && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-vz-charcoal/90 border border-zinc-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-vz-charcoal"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}
