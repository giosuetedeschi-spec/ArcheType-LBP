import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { GameCard } from "@/components/GameCard";
import { useI18n } from "@/i18n/I18nContext";
import { useColorblind } from "@/contexts/ColorblindContext";
import {
  CatalogFiltersBar,
  FiltersSidebar,
  DEFAULT_FILTERS,
  type CatalogFilters,
} from "@/components/CatalogFilters";
import { gameApi, type GameFilterRequest, type PagedResponse } from "@/lib/api";
import { Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog — ArcheType" },
      { name: "description", content: "Browse the Steam catalog with advanced filters." },
    ],
  }),
  component: Catalog,
});

const PAGE_SIZE = 24;

function Catalog() {
  const { t } = useI18n();
  const { mode: colorblindMode } = useColorblind();
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);

  const filterRequest: GameFilterRequest = {
    search: filters.search,
    genre: filters.genres[0] ?? undefined,
    minPrice: filters.freeOnly ? 0 : undefined,
    maxPrice: filters.priceMax < 70 ? filters.priceMax : undefined,
    minRating: filters.minRating > 0 ? filters.minRating : undefined,
    sortBy: sortMap[filters.sort],
    sortDir: filters.sort.includes("desc") || filters.sort === "price-asc" ? "desc" : "asc",
    page,
    size: PAGE_SIZE,
  };

  const { data, isLoading, error } = useGameFilter(filterRequest);

  const results = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handleFilters = (f: CatalogFilters) => {
    setFilters(f);
    setPage(0);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("nav.catalog")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("catalog.results", { count: totalElements })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersSidebar filters={filters} onChange={handleFilters} colorblindMode={colorblindMode} />
        <div className="min-w-0">
          <CatalogFiltersBar
            filters={filters}
            onChange={handleFilters}
            resultCount={totalElements}
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
          />

          {isLoading && (
            <div className="flex justify-center py-16">
              <Gamepad2 className="h-8 w-8 animate-spin text-brand" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
              {t("common.error")}
            </div>
          )}

          {!isLoading && !error && results.length === 0 && (
            <div className="card-surface grid place-items-center p-12 text-center">
              <p className="text-muted-foreground">No games match your filters.</p>
              <button
                onClick={() => handleFilters(DEFAULT_FILTERS)}
                className="mt-3 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm hover:bg-surface-3"
              >
                {t("catalog.clearAll")}
              </button>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {results.map((g) => <GameCard key={g.id} game={g} />)}
              </div>
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const sortMap: Record<string, string> = {
  popular: "name",
  rating: "rating",
  "price-asc": "price",
  "price-desc": "price",
  "year-desc": "releaseDate",
};

import { useQuery } from "@tanstack/react-query";

function useGameFilter(filters: GameFilterRequest) {
  return useQuery<PagedResponse>({
    queryKey: ["games", "filter", filters],
    queryFn: () => gameApi.filter(filters),
    placeholderData: (prev) => prev,
  });
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        ←
      </button>
      <span className="text-sm text-muted-foreground">
        {page + 1} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

// Type re-export for CatalogFilters
export type { CatalogFilters };
