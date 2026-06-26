import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { GameCard } from "@/components/GameCard";
import { GAMES } from "@/lib/games-data";
import {
  CatalogFiltersBar,
  FiltersSidebar,
  DEFAULT_FILTERS,
  type CatalogFilters,
} from "@/components/CatalogFilters";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalogo — SteamStats" },
      { name: "description", content: "Esplora il catalogo Steam con filtri avanzati per genere, prezzo e voto." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const games = GAMES;

  const results = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let r = games.filter((g) => {
      if (q && !(g.name.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q)))) return false;
      if (filters.genres.length && !filters.genres.some((x) => g.genres.includes(x))) return false;
      if (filters.tags.length && !filters.tags.some((x) => g.tags.includes(x))) return false;
      if (filters.platforms.length && !filters.platforms.some((x) => g.platforms.includes(x as "windows" | "mac" | "linux"))) return false;
      if (filters.freeOnly && g.price !== 0) return false;
      if (g.price > filters.priceMax) return false;
      if (g.rating < filters.minRating) return false;
      return true;
    });
    switch (filters.sort) {
      case "rating": r = [...r].sort((a, b) => b.rating - a.rating); break;
      case "price-asc": r = [...r].sort((a, b) => a.price - b.price); break;
      case "price-desc": r = [...r].sort((a, b) => b.price - a.price); break;
      case "year-desc": r = [...r].sort((a, b) => b.releaseYear - a.releaseYear); break;
    }
    return r;
  }, [filters]);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Catalogo</h1>
        <p className="text-sm text-muted-foreground">Filtra fra {games.length} giochi dal dataset Steam.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersSidebar filters={filters} onChange={setFilters} />
        <div className="min-w-0">
          <CatalogFiltersBar filters={filters} onChange={setFilters} resultCount={results.length} />
          {results.length === 0 ? (
            <div className="card-surface grid place-items-center p-12 text-center text-muted-foreground">
              <p>Nessun gioco corrisponde ai filtri.</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="mt-3 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm hover:bg-surface-3"
              >
                Reimposta filtri
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((g) => <GameCard key={g.id} game={g} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
