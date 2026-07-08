import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLeaderboard } from "../services/leaderboardApi";
import { useAuth } from "../context/AuthContext";

// "local" è rimandato: il backend non ha ancora un campo regione
// sull'utente (LeaderboardFilterRequest.java) — solo 2 tab per ora.
const SCOPES = ["global", "friends"];
const METRICS = ["hours", "games", "friends"];

// LeaderboardPage — classifica utenti con tab (globale/amici) e filtro
// metrica, stato tenuto nella query string (?scope=&metric=&page=),
// come LibraryPage fa con ?status= (vedi routes/leaderboard.tsx).
export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const search = useSearch({ from: "/leaderboard" });
  const navigate = useNavigate();

  const scope = SCOPES.includes(search.scope) ? search.scope : "global";
  const metric = METRICS.includes(search.metric) ? search.metric : "hours";
  const page = search.page || 0;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeaderboard({ userId: user.id, scope, metric, page });
      setData(result);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [user.id, scope, metric, page, t]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  function updateSearch(next) {
    navigate({ to: "/leaderboard", search: { scope, metric, page: 0, ...next } });
  }

  function formatValue(value) {
    // "hours": il backend restituisce i minuti totali (UserGame.playTimeMin) —
    // si converte qui, sola per la visualizzazione.
    if (metric === "hours") return Math.round(value / 60);
    return value;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-white mb-6">{t("leaderboard.title")}</h1>

      <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
        <div className="flex gap-2">
          {SCOPES.map((s) => (
            <button
              key={s}
              onClick={() => updateSearch({ scope: s })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                scope === s
                  ? "bg-vz-lime text-vz-navy"
                  : "bg-vz-charcoal border border-zinc-700 text-zinc-300 hover:border-vz-lime"
              }`}
            >
              {t(`leaderboard.scope.${s}`)}
            </button>
          ))}
        </div>

        <select
          value={metric}
          onChange={(e) => updateSearch({ metric: e.target.value })}
          className="bg-vz-charcoal border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-vz-lime"
        >
          {METRICS.map((m) => (
            <option key={m} value={m}>
              {t(`leaderboard.metric.${m}`)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-zinc-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}

      {!loading && !error && data && (
        <>
          {data.myEntry && (
            <div className="flex items-center gap-4 bg-vz-charcoal border border-vz-lime rounded-xl p-4 mb-4">
              <span className="w-10 text-center font-display font-bold text-vz-lime">
                #{data.myEntry.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-vz-lime text-vz-navy flex items-center justify-center text-sm font-bold font-display">
                {data.myEntry.username.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-white font-semibold">{data.myEntry.username}</span>
              <span className="text-vz-lime font-bold">{formatValue(data.myEntry.value)}</span>
              <span className="text-xs text-zinc-400">{t("leaderboard.you")}</span>
            </div>
          )}

          {data.entries.length === 0 && (
            <p className="text-zinc-400">{t("leaderboard.empty")}</p>
          )}

          <div className="flex flex-col gap-2">
            {data.entries.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 rounded-xl p-4 border ${
                  entry.userId === user.id
                    ? "bg-vz-charcoal border-vz-lime"
                    : "bg-vz-charcoal border-zinc-800"
                }`}
              >
                <span className="w-10 text-center font-display font-bold text-zinc-400">
                  #{entry.rank}
                </span>
                <div className="w-8 h-8 rounded-full bg-zinc-700 text-white flex items-center justify-center text-sm font-bold font-display">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-white">{entry.username}</span>
                <span className="text-zinc-300 font-semibold">{formatValue(entry.value)}</span>
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={page <= 0}
                onClick={() => updateSearch({ page: page - 1 })}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 disabled:opacity-40 hover:border-vz-lime transition-colors"
              >
                {t("leaderboard.prev")}
              </button>
              <span className="text-sm text-zinc-400">
                {t("leaderboard.page", { current: page + 1, total: data.totalPages })}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => updateSearch({ page: page + 1 })}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 disabled:opacity-40 hover:border-vz-lime transition-colors"
              >
                {t("leaderboard.next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
