import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { getLeaderboard } from "../services/leaderboardApi";
import { getFriends, sendFriendRequest } from "../services/friendsApi";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import type { LeaderboardResponse, LeaderboardScope, LeaderboardMetric } from "@/types/api";

// "local" è rimandato: il backend non ha ancora un campo regione
// sull'utente (LeaderboardFilterRequest.java) — solo 2 tab per ora.
const SCOPES: LeaderboardScope[] = ["global", "friends"];
const METRICS: LeaderboardMetric[] = ["hours", "games", "friends"];

// Accenti podio (oro/argento/bronzo) per le prime 3 posizioni — sfumatura
// sulla riga, colore pieno sul numero, gradiente sul nome. Oltre il 3°
// posto si ricade sullo stile neutro esistente.
const PODIUM_ACCENTS: Record<number, { row: string; number: string; name: string }> = {
  1: {
    row: "bg-gradient-to-r from-amber-400/20 via-vz-charcoal to-vz-charcoal border-amber-400/40",
    number: "text-amber-400",
    name: "bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent",
  },
  2: {
    row: "bg-gradient-to-r from-slate-300/20 via-vz-charcoal to-vz-charcoal border-slate-300/30",
    number: "text-slate-300",
    name: "bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-transparent",
  },
  3: {
    row: "bg-gradient-to-r from-orange-500/20 via-vz-charcoal to-vz-charcoal border-orange-500/30",
    number: "text-orange-500",
    name: "bg-gradient-to-r from-orange-300 via-orange-400 to-orange-600 bg-clip-text text-transparent",
  },
};

// LeaderboardPage — classifica utenti con tab (globale/amici) e filtro
// metrica, stato tenuto nella query string (?scope=&metric=&page=),
// come LibraryPage fa con ?status= (vedi routes/leaderboard.tsx).
export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const search = useSearch({ from: "/leaderboard" });
  const navigate = useNavigate();

  const scope: LeaderboardScope = SCOPES.includes(search.scope as LeaderboardScope)
    ? (search.scope as LeaderboardScope)
    : "global";
  const metric: LeaderboardMetric = METRICS.includes(search.metric as LeaderboardMetric)
    ? (search.metric as LeaderboardMetric)
    : "hours";
  const page = search.page || 0;

  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Id degli amici già accettati, per nascondere/disabilitare il bottone
  // "Aggiungi" nella riga corrispondente — aggiornato otticamente dopo un
  // invio riuscito, così non serve un refetch per il feedback immediato.
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
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
  }, [user, scope, metric, page, t]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!user) return;
    getFriends(user.id).then((result) => setFriendIds(new Set(result.map((f) => f.friendId))));
  }, [user]);

  async function handleAddFriend(candidateId: number) {
    if (!user) return;
    setPendingIds((prev) => new Set(prev).add(candidateId));
    try {
      await sendFriendRequest(user.id, candidateId);
    } catch {
      // Se l'invio fallisce (es. richiesta già pendente) l'utente può
      // comunque riprovare dalla pagina Amici — qui basta non bloccare
      // il bottone per sempre in stato "inviato".
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  }

  function updateSearch(next) {
    navigate({ to: "/leaderboard", search: { scope, metric, page: 0, ...next } });
  }

  function formatValue(value) {
    // "hours": il backend restituisce i minuti totali (UserGame.playTimeMin) —
    // si converte qui, sola per la visualizzazione.
    if (metric === "hours") return Math.round(value / 60);
    return value;
  }

  if (!user) return null;

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
                  : "bg-vz-charcoal border border-slate-700 text-slate-300 hover:border-vz-lime"
              }`}
            >
              {t(`leaderboard.scope.${s}`)}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={metric}
            onChange={(e) => updateSearch({ metric: e.target.value })}
            className="appearance-none bg-vz-charcoal border border-slate-700 rounded-lg pl-3 pr-9 py-2 text-white focus:outline-none focus:ring-2 focus:ring-vz-lime"
          >
            {METRICS.map((m) => (
              <option key={m} value={m}>
                {t(`leaderboard.metric.${m}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading && <p className="text-slate-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}

      {!loading && !error && data && (
        <>
          {data.myEntry && (
            <div className="flex items-center gap-4 bg-vz-charcoal border border-vz-lime rounded-xl p-4 mb-4">
              <span className="w-10 text-center font-display font-bold text-vz-lime">
                #{data.myEntry.rank}
              </span>
              <Avatar username={data.myEntry.username} avatarUrl={data.myEntry.avatarUrl} size={32} variant="lime" />
              <span className="flex-1 text-white font-semibold">{data.myEntry.username}</span>
              <span className="text-vz-lime font-bold">{formatValue(data.myEntry.value)}</span>
              <span className="text-xs text-slate-400">{t("leaderboard.you")}</span>
            </div>
          )}

          {data.entries.length === 0 && (
            <p className="text-slate-400">{t("leaderboard.empty")}</p>
          )}

          <div className="flex flex-col gap-2">
            {data.entries.map((entry) => {
              const podium = PODIUM_ACCENTS[entry.rank];
              const isSelf = entry.userId === user.id;
              const isFriend = friendIds.has(entry.userId);
              const isPending = pendingIds.has(entry.userId);
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 rounded-xl p-4 border ${
                    podium ? podium.row : isSelf ? "bg-vz-charcoal border-vz-lime" : "bg-vz-charcoal border-slate-800"
                  }`}
                >
                  <span className={`w-10 text-center font-display font-bold ${podium ? podium.number : "text-slate-400"}`}>
                    #{entry.rank}
                  </span>
                  <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size={32} />
                  <span className={podium ? `font-bold ${podium.name}` : "text-white"}>
                    {entry.username}
                  </span>
                  {!isSelf && (
                    <button
                      onClick={() => handleAddFriend(entry.userId)}
                      disabled={isFriend || isPending}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-md border border-vz-lime text-vz-lime hover:bg-vz-lime hover:text-vz-navy disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-vz-lime transition-colors"
                    >
                      {isFriend ? t("friends.alreadyFriends") : isPending ? t("friends.requestSent") : t("friends.add")}
                    </button>
                  )}
                  <span className="flex-1 text-right text-slate-300 font-semibold">{formatValue(entry.value)}</span>
                </div>
              );
            })}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                disabled={page <= 0}
                onClick={() => updateSearch({ page: page - 1 })}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:border-vz-lime transition-colors"
              >
                {t("leaderboard.prev")}
              </button>
              <span className="text-sm text-slate-400">
                {t("leaderboard.page", { current: page + 1, total: data.totalPages })}
              </span>
              <button
                disabled={page + 1 >= data.totalPages}
                onClick={() => updateSearch({ page: page + 1 })}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:border-vz-lime transition-colors"
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
