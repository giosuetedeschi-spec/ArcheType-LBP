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

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import GameCard from "./GameCard";
import { searchCatalog } from "../services/gamesApi";
import type { Game } from "@/types/api";

/**
 * Props per il componente GameCarousel.
 *
 * @property title - Titolo della sezione mostrato sopra il carosello.
 * @property games - Lista di giochi da visualizzare come card scorrevoli.
 */
/**
 * Props per il componente GameCarousel.
 *
 * @property title - Titolo della sezione mostrato sopra il carosello.
 * @property games - Lista di giochi da visualizzare come card scorrevoli.
 */
interface GameCarouselProps {
  genre: string;
  title: string;
}

// Larghezza card (w-64 = 256px) + gap-4 (16px), usata per far scorrere gli
// scroll button di uno "step" coerente con lo scroll nativo touch.
const CARD_STEP = 272;

export default function GameCarousel({ genre, title }: GameCarouselProps) {
  const { t } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // sortBy/sortDir espliciti per mostrare i titoli più diffusi del genere,
  // non i primi in ordine alfabetico — stesso motivo di HomePage.tsx.
  const { data, isLoading } = useQuery({
    queryKey: ["games", "genre", genre],
    queryFn: () => searchCatalog({ page: 0, size: 20, genre, sortBy: "estimatedOwners", sortDir: "desc" }),
  });

  const games: Game[] = data?.content ?? [];

  // Scroll nativo (non più via transform): così su mobile/tablet lo swipe
  // touch funziona anche se le frecce (hover-only) sono invisibili.
  const handlePrev = () => scrollerRef.current?.scrollBy({ left: -CARD_STEP, behavior: "smooth" });
  const handleNext = () => scrollerRef.current?.scrollBy({ left: CARD_STEP, behavior: "smooth" });

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
        <button
          onClick={handlePrev}
          aria-label={t("common.previous", { defaultValue: "Previous" })}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-vz-charcoal/90 border border-slate-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-vz-charcoal"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Scroll nativo (swipe touch su mobile, drag/wheel su desktop) invece
            di un transform pilotato da stato: le frecce sopra/sotto sono solo
            uno shortcut per mouse, non l'unico modo di scorrere. */}
        <div
          ref={scrollerRef}
          className="flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {games.map((game) => (
            <div key={game.id} className="w-64 flex-shrink-0 snap-start">
              <GameCard game={game} />
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label={t("common.next", { defaultValue: "Next" })}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-vz-charcoal/90 border border-slate-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-vz-charcoal"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </section>
  );
}
