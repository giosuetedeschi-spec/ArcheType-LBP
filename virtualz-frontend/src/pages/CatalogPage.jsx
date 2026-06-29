import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { searchCatalog, getGenres } from "../services/gamesApi";
import GameCard from "../components/GameCard";
import GameCardSkeleton from "../components/GameCardSkeleton";

export default function CatalogPage() {
  const { t } = useTranslation();
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ search: "", genre: "", minPrice: "", maxPrice: "" });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    getGenres().then(setGenres).catch(() => setGenres([]));
  }, []);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v != null)
      );
      const result = await searchCatalog({ ...cleanFilters, page, size: 20 });
      setGames(result.content || []);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [filters, page, t]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  function handleFilterChange(field, value) {
    setPage(0);
    setFilters((f) => ({ ...f, [field]: value }));
  }

  const inputClass =
    "bg-vz-charcoal border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-vz-lime focus:border-transparent transition-shadow";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-8 animate-fade-in-up">
        <p className="text-vz-lime text-sm font-semibold tracking-wide uppercase mb-2">
          VirtualZ — Your Gaming Pleasure
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
          {t("catalog.title")}
        </h1>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3 mb-10">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          <input
            type="text"
            placeholder={t("catalog.searchPlaceholder")}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className={`${inputClass} w-full pl-10`}
          />
        </div>
        <select
          value={filters.genre}
          onChange={(e) => handleFilterChange("genre", e.target.value)}
          className={inputClass}
        >
          <option value="">{t("catalog.genre")}</option>
          {genres.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder={t("catalog.minPrice")}
          value={filters.minPrice}
          onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          className={`${inputClass} w-32`}
        />
        <input
          type="number"
          placeholder={t("catalog.maxPrice")}
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          className={`${inputClass} w-32`}
        />
      </div>

      {/* Stato di caricamento: skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Errore */}
      {!loading && error && (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-vz-pink font-medium">{error}</p>
          <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
            Il catalogo si popolerà quando il backend e il database saranno collegati.
          </p>
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
          <p className="text-zinc-400">{t("catalog.noResults")}</p>
        </div>
      )}

      {/* Griglia giochi */}
      {!loading && !error && games.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game, i) => (
            <div key={game.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
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
  );
}
