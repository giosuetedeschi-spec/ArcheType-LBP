/**
 * CatalogPage - Catalogo giochi con sidebar filtri, ordinamento e paginazione
 *
 * Layout: sidebar sinistra (filtri) + area risultati (ricerca, ordinamento, griglia).
 *
 * Filtri:
 *  - Genere      → funzionante. Mostra sempre la lista curata/tradotta (CURATED_GENRES)
 *                  come base, più eventuali generi reali aggiuntivi da GET /genres non
 *                  ancora coperti da quella lista (es. dopo un import CSV più ricco).
 *                  Etichetta = localizzata via i18n `genres.<nome>` quando esiste una
 *                  traduzione, altrimenti nome grezzo. Se la fetch fallisce, resta solo
 *                  la lista curata.
 *  - Prezzo      → funzionante (minPrice / maxPrice).
 *  - Sistema op. → funzionante (checkbox multiple, OR lato backend). Valori:
 *                  "windows" | "mac" | "linux", dai campi booleani reali
 *                  sull'oggetto Game (colonne Windows/Mac/Linux del dataset Steam).
 *  - VR          → funzionante (checkbox singola). Riusa le categorie Steam
 *                  già importate ("VR Support"/"VR Only"/ecc.), non un campo dedicato.
 *  - Voto utenti → funzionante (minUserRating). Media delle recensioni scritte dagli
 *                  utenti sulla piattaforma (tabella reviews), distinta dal rating Steam
 *                  del dataset importato.
 *  - 18+         → funzionante (checkbox singola, "Mostra giochi 18+"). games.mature
 *                  (Required age >= 18, genere Nudity/Sexual Content/Gore/Violent, o
 *                  "hentai" nel nome — vedi populate_db.py) è nascosto di default dal
 *                  catalogo; la checkbox è un opt-in per farlo ricomparire, non un
 *                  "solo 18+" come VR. Quando attiva, quei generi ricompaiono anche
 *                  come opzioni nel filtro Genere (richiesta lista genere con
 *                  getGenres(true), altrimenti il backend le nasconde comunque).
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

// Lista curata mostrata sempre come base (traduzione garantita in tutte le lingue).
// "Horror" non esiste come genere ufficiale nella tassonomia Steam (è un tag, non un
// genere), quindi non è mai stato incluso: qualunque gioco reale non lo avrebbe mai
// avuto tra i suoi generi.
const CURATED_GENRES = ["Action", "Adventure", "RPG", "Strategy", "Indie"];

// Stessi nomi esatti (case-sensitive) di ADULT_GENRE_NAMES lato backend
// (GenreController.java / populate_db.py) — generi che compaiono nel
// selettore, e nei risultati, solo con "Mostra giochi 18+" attivo.
const ADULT_GENRE_NAMES = ["Nudity", "Sexual Content", "Gore", "Violent"];

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

// Sistema operativo: label mostrata -> valore inviato al backend (GameFilterRequest.os).
const OS_OPTIONS = [
  { label: "Windows", value: "windows" },
  { label: "Mac", value: "mac" },
  { label: "Linux", value: "linux" },
] as const;

interface FilterState {
  search: string;
  genre: string;
  minPrice: string;
  maxPrice: string;
  os: string[];
  vr: boolean;
  minUserRating: string;
  mature: boolean;
  sort: string; // "campo:direzione" oppure ""
}

const EMPTY_FILTERS: FilterState = {
  search: "",
  genre: "",
  minPrice: "",
  maxPrice: "",
  os: [],
  vr: false,
  minUserRating: "",
  mature: false,
  sort: "rating:desc",
};

// Valori dello <select> voto minimo utenti (scala reviews.rating, 1-5).
const MIN_USER_RATING_OPTIONS = ["3", "4", "4.5"] as const;

export default function CatalogPage() {
  const { t } = useTranslation();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [genres, setGenres] = useState<string[]>(CURATED_GENRES);

  // Carica l'elenco generi alla lista curata aggiunge eventuali generi reali
  // dal backend non già presenti. Dipende da filters.mature: quando la
  // checkbox "Mostra giochi 18+" è spuntata, il backend include anche
  // Nudity/Sexual Content nell'elenco (altrimenti restano nascosti, coerente
  // con l'esclusione di games.mature dai risultati — vedi GenreController).
  useEffect(() => {
    getGenres(filters.mature)
      .then((result) => {
        if (!result?.length) {
          setGenres(CURATED_GENRES);
          return;
        }
        const extra = result.filter((g) => !CURATED_GENRES.includes(g));
        setGenres(extra.length ? [...CURATED_GENRES, ...extra] : CURATED_GENRES);
      })
      .catch(() => {
        // GET /genres non raggiungibile: resta la lista curata già impostata
      });
  }, [filters.mature]);

  // Se l'utente disattiva "Mostra giochi 18+" mentre ha selezionato un
  // genere che ricompare solo con quel toggle attivo (Nudity/Sexual
  // Content), il filtro genere resterebbe "agganciato" a un valore non più
  // proponibile nella lista — lo si azzera per evitare un filtro fantasma.
  useEffect(() => {
    if (!filters.mature && ADULT_GENRE_NAMES.includes(filters.genre)) {
      setFilters((f) => ({ ...f, genre: "" }));
    }
  }, [filters.mature, filters.genre]);

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
      if (filters.os.length) params.os = filters.os;
      if (filters.vr) params.vr = true;
      if (filters.minUserRating) params.minUserRating = Number(filters.minUserRating);
      if (filters.mature) params.mature = true;
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

  // Toggle sistema operativo: multi-selezione (OR lato backend)
  function toggleOs(value: string) {
    setPage(0);
    setFilters((f) => ({
      ...f,
      os: f.os.includes(value) ? f.os.filter((v) => v !== value) : [...f.os, value],
    }));
  }

  function toggleVr() {
    setPage(0);
    setFilters((f) => ({ ...f, vr: !f.vr }));
  }

  function toggleMature() {
    setPage(0);
    setFilters((f) => ({ ...f, mature: !f.mature }));
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
    filters.os.length > 0 ||
    filters.vr ||
    filters.minUserRating !== "" ||
    filters.mature ||
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

            {/* --- Sistema operativo --- */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("catalog.os")}
              </h3>
              <ul className="space-y-2">
                {OS_OPTIONS.map((os) => (
                  <li key={os.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`os-${os.value}`}
                      checked={filters.os.includes(os.value)}
                      onChange={() => toggleOs(os.value)}
                      className="h-4 w-4 rounded border-zinc-600 bg-vz-charcoal text-vz-lime focus:ring-vz-lime cursor-pointer"
                    />
                    <label htmlFor={`os-${os.value}`} className="text-sm text-zinc-300 cursor-pointer">
                      {os.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- VR --- */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vr-filter"
                  checked={filters.vr}
                  onChange={toggleVr}
                  className="h-4 w-4 rounded border-zinc-600 bg-vz-charcoal text-vz-lime focus:ring-vz-lime cursor-pointer"
                />
                <label htmlFor="vr-filter" className="text-sm text-zinc-300 cursor-pointer">
                  {t("catalog.vrOnly")}
                </label>
              </div>
            </div>

            {/* --- Voto utenti --- */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                {t("catalog.userRating")}
              </h3>
              <select
                value={filters.minUserRating}
                onChange={(e) => handleFilterChange("minUserRating", e.target.value)}
                className={`${inputClass} w-full`}
              >
                <option value="">{t("catalog.userRatingAny")}</option>
                {MIN_USER_RATING_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {t("catalog.userRatingAndUp", { value })}
                  </option>
                ))}
              </select>
            </div>

            {/* --- 18+ --- */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mature-filter"
                  checked={filters.mature}
                  onChange={toggleMature}
                  className="h-4 w-4 rounded border-zinc-600 bg-vz-charcoal text-vz-lime focus:ring-vz-lime cursor-pointer"
                />
                <label htmlFor="mature-filter" className="text-sm text-zinc-300 cursor-pointer">
                  {t("catalog.showMature")}
                </label>
              </div>
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
