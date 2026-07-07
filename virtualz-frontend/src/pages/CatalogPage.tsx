/**
 * CatalogPage - Catalogo giochi con sidebar filtri, ordinamento e paginazione
 *
 * Layout: sidebar sinistra (filtri) + area risultati (ricerca, ordinamento, griglia).
 *
 * Filtri:
 *  - Genere      → funzionante. Lista caricata dinamicamente da GET /genres (ora che il
 *                  backend espone l'endpoint). Etichetta mostrata = localizzata via i18n
 *                  `genres.<nome>` quando esiste una traduzione, altrimenti nome grezzo
 *                  (il catalogo ha molti più generi dei pochi tradotti a mano).
 *                  Se la fetch fallisce, si ricade su una lista statica minima.
 *  - Prezzo      → funzionante (minPrice / maxPrice).
 *  - Sistema op. → DISABILITATO + badge "in arrivo". Il backend non espone ancora
 *                  un campo piattaforma/OS sull'oggetto Game, quindi non è filtrabile.
 *                  Da riattivare quando il backend aggiungerà il dato.
 *  - Ordinamento → funzionante (sortBy + sortDir, già previsti da CatalogSearchParams).
 *
 * NOTA ricerca: il parametro inviato è `name` (come documentato in CatalogSearchParams),
 * non `search`. Da verificare con il backend live che /games onori name/genre/sort.
 *
 * @requires searchCatalog (services/gamesApi)
 * @requires GameCard, GameCardSkeleton
 */

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { searchCatalog, getGenres } from "../services/gamesApi";
import GameCard from "../components/GameCard";
import GameCardSkeleton from "../components/GameCardSkeleton";
import type { CatalogSearchParams, Game } from "@/types/api";

// Fallback usato solo se GET /genres fallisce (es. backend momentaneamente giù).
const FALLBACK_GENRES = ["Action", "Adventure", "RPG", "Strategy", "Indie", "Horror"];

// Ordinamento: value = "campo:direzione" (vuoto = nessun ordinamento / rilevanza).
const SORT_OPTIONS = [
  { value: "", labelKey: "catalog.sortRelevance" },
  { value: "name:asc", labelKey: "catalog.sortNameAsc" },
  { value: "name:desc", labelKey: "catalog.sortNameDesc" },
  { value: "price:asc", labelKey: "catalog.sortPriceAsc" },
  { value: "price:desc", labelKey: "catalog.sortPriceDesc" },
  { value: "rating:desc", labelKey: "catalog.sortRatingDesc" },
  { value: "releaseDate:desc", labelKey: "catalog.sortNewest" },
] as const;

// Sistema operativo: solo visivo/disabilitato finché il backend non espone il campo.
const OS_OPTIONS = ["Windows", "Linux", "SteamDeck"] as const;

interface FilterState {
  search: string;
  genre: string;
  minPrice: string;
  maxPrice: string;
  sort: string; // "campo:direzione" oppure ""
}

const EMPTY_FILTERS: FilterState = {
  search: "",
  genre: "",
  minPrice: "",
  maxPrice: "",
  sort: "rating:desc",
};

export default function CatalogPage() {
  const { t } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [genres, setGenres] = useState<string[]>(FALLBACK_GENRES);

  // Carica l'elenco generi una sola volta all'ingresso nella pagina
  useEffect(() => {
    getGenres()
      .then((result) => {
        if (result?.length) setGenres(result);
      })
      .catch(() => {
        // GET /genres non raggiungibile: resta il fallback statico già impostato
      });
  }, []);

  // Carica i giochi in base ai filtri correnti e alla pagina
  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: CatalogSearchParams = { page, size: 20 };
      if (filters.search) params.name = filters.search;
      if (filters.genre) params.genre = filters.genre;
      if (filters.minPrice) params.minPrice = Number(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
      if (filters.sort) {
        const [sortBy, sortDir] = filters.sort.split(":");
        params.sortBy = sortBy;
        params.sortDir = sortDir as "asc" | "desc";
      }

      const result = await searchCatalog(params);
      setGames(result.content || []);
      setTotalPages(result.totalPages || 1);
      setTotalElements(result.totalElements || (result.content?.length ?? 0));
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [filters, page, t]);

  // Ricarica quando cambiano filtri o pagina
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Aggiorna un filtro e torna alla prima pagina
  function handleFilterChange(field: keyof FilterState, value: string) {
    setPage(0);
    setFilters((f) => ({ ...f, [field]: value }));
  }

  // Toggle genere: riclick sullo stesso genere = deseleziona
  function toggleGenre(value: string) {
    handleFilterChange("genre", filters.genre === value ? "" : value);
  }

  function resetFilters() {
    setPage(0);
    setFilters(EMPTY_FILTERS);
  }

  const hasActiveFilters =
    filters.search !== "" ||
    filters.genre !== "" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.sort !== "";

  const inputClass =
    "bg-vz-charcoal border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime focus:border-transparent transition-shadow";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Titolo pagina */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
          {t("catalog.title")}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ============ SIDEBAR FILTRI ============ */}
        <aside className="w-full lg:w-64 lg:shrink-0 animate-fade-in-up">
          <div className="lg:sticky lg:top-6 bg-vz-navy/40 border border-vz-lime/25 rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-vz-lime text-lg">
                {t("catalog.filters")}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-zinc-400 hover:text-vz-pink transition-colors"
                >
                  {t("catalog.reset")}
                </button>
              )}
            </div>

            {/* --- Genere --- */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("catalog.genre")}
              </h3>
              <ul className="space-y-1">
                {genres.map((g) => {
                  const active = filters.genre === g;
                  return (
                    <li key={g}>
                      <button
                        onClick={() => toggleGenre(g)}
                        aria-pressed={active}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-vz-lime/15 text-vz-lime font-medium"
                            : "text-zinc-300 hover:text-white hover:bg-vz-charcoal/60"
                        }`}
                      >
                        {t(`genres.${g.toLowerCase()}`, { defaultValue: g })}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* --- Sistema operativo (disabilitato: in arrivo) --- */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {t("catalog.os")}
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-vz-pink/15 text-vz-pink">
                  {t("catalog.comingSoon")}
                </span>
              </div>
              <ul className="space-y-2 opacity-50 pointer-events-none select-none">
                {OS_OPTIONS.map((os) => (
                  <li key={os} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled
                      aria-disabled="true"
                      className="h-4 w-4 rounded border-zinc-600 bg-vz-charcoal"
                    />
                    <span className="text-sm text-zinc-400">{os}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- Prezzo --- */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("catalog.price")}
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={t("catalog.minPrice")}
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className={`${inputClass} w-full`}
                />
                <span className="text-zinc-500">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder={t("catalog.maxPrice")}
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className={`${inputClass} w-full`}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* ============ AREA RISULTATI ============ */}
        <div className="flex-1 min-w-0">
          {/* Barra: ricerca + ordinamento */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
              <input
                type="text"
                placeholder={t("catalog.searchPlaceholder")}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className={`${inputClass} w-full pl-10 py-2.5`}
              />
            </div>
            <label className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-zinc-400 hidden sm:inline">
                {t("catalog.sortBy")}
              </span>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className={`${inputClass} py-2.5`}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Contatore risultati */}
          {!loading && !error && (
            <p className="text-sm text-zinc-500 mb-4">
              {t("catalog.results", { count: totalElements })}
            </p>
          )}

          {/* Stato caricamento */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Stato errore */}
          {!loading && error && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="text-5xl mb-4">🎮</div>
              <p className="text-vz-pink font-medium">{error}</p>
              <button
                onClick={fetchGames}
                className="mt-5 px-5 py-2 rounded-full bg-vz-lime text-vz-navy font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("catalog.loadMore")}
              </button>
            </div>
          )}

          {/* Nessun risultato */}
          {!loading && !error && games.length === 0 && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-zinc-400 mb-4">{t("catalog.noResults")}</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-5 py-2 rounded-full bg-vz-lime text-vz-navy font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t("catalog.reset")}
                </button>
              )}
            </div>
          )}

          {/* Griglia giochi */}
          {!loading && !error && games.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {games.map((game, i) => (
                <div
                  key={game.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          )}

          {/* Paginazione */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-9 h-9 rounded-full text-sm transition-colors ${
                    i === page
                      ? "bg-vz-lime text-vz-navy font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-vz-charcoal"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
