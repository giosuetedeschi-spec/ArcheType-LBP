import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { getLibrary, updateLibraryStatus, removeFromLibrary } from "../services/libraryApi";
import { getFriends } from "../services/friendsApi";
import { getUser, getUserStats } from "../services/usersApi";
import { getLeaderboard } from "../services/leaderboardApi";
import { getUserReviews } from "../services/reviewsApi";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";
import { getToken } from "../services/tokenStorage";
import LibraryItemCard from "../components/LibraryItemCard";
import GenreBarChart from "../components/GenreBarChart";
import LibraryCompositionBar from "../components/LibraryCompositionBar";
import StarRating from "../components/StarRating";
import Avatar from "../components/Avatar";
import type { FriendItem, LeaderboardResponse, LibraryItem, LibraryStatus, Review, UserStats } from "@/types/api";

// STAT_CARDS.key deve combaciare con le chiavi dell'oggetto `stats` più sotto
type StatKey = "totalGames" | "inProgress" | "finished" | "abandoned" | "wishlistCount";

const STAT_CARDS: { key: StatKey; color: string }[] = [
  { key: "totalGames", color: "text-white" },
  { key: "inProgress", color: "text-blue-300" },
  { key: "finished", color: "text-vz-lime" },
  { key: "abandoned", color: "text-slate-400" },
  { key: "wishlistCount", color: "text-vz-pink" },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [friendStats, setFriendStats] = useState<Record<number, UserStats>>({});
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [steamLinked, setSteamLinked] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Esito del redirect da SteamAuthController.linkCallback (?steamLinked=true
  // o ?error=...) — letto una sola volta al montaggio, poi ripulito dall'URL
  // così un refresh della pagina non ripropone lo stesso messaggio.
  const [steamLinkMessage, setSteamLinkMessage] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("steamLinked") === "true") {
      setSteamLinkMessage({ ok: true, text: t("profile.steamLinkSuccess") });
      setSteamLinked(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("error")) {
      setSteamLinkMessage({ ok: false, text: t("profile.steamLinkError") });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [t]);

  // ProfilePage è raggiungibile solo da utente autenticato (route protetta),
  // ma TypeScript non lo sa: user può essere null per tipo. Guard esplicita
  // invece di un cast, per restare onesti col compilatore.
  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    try {
      const [libraryResult, friendsResult, myStatsResult, leaderboardResult, myReviewsResult, myProfile] =
        await Promise.all([
          getLibrary(user.id),
          getFriends(user.id),
          getUserStats(user.id),
          // Riassunto: prime 3 posizioni globali per ore di gioco + la
          // propria posizione (myEntry, calcolata su tutta la classifica
          // indipendentemente da page/size — vedi nota in @/types/api).
          getLeaderboard({ userId: user.id, scope: "global", metric: "hours", page: 0, size: 3 }),
          getUserReviews(user.id),
          getUser(user.id),
        ]);
      setLibrary(libraryResult);
      setFriends(friendsResult);
      setMyStats(myStatsResult);
      setLeaderboard(leaderboardResult);
      setMyReviews(myReviewsResult);
      setSteamLinked(myProfile.steamLinked);
      setAvatarUrl(myProfile.avatarUrl);

      // Statistiche per ogni amico (giochi posseduti/in corso), in
      // parallelo — stesso pattern usato in FriendsPage.tsx.
      const statsEntries = await Promise.all(
        friendsResult.map(async (f) => [f.friendId, await getUserStats(f.friendId)] as const)
      );
      setFriendStats(Object.fromEntries(statsEntries));
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Stessa distinzione id voce / id gioco spiegata in LibraryItemCard.tsx:
  // entryId è l'id della voce di libreria (LibraryItem.id), non il gameId.
  async function handleStatusChange(entryId: number, newStatus: LibraryStatus) {
    if (!user) return;
    await updateLibraryStatus(user.id, entryId, newStatus);
    fetchLibrary();
  }

  async function handleRemove(entryId: number) {
    if (!user) return;
    await removeFromLibrary(user.id, entryId);
    fetchLibrary();
  }

  // NOTA: i valori di status sono quelli REALI validati dal backend
  // (vedi LibraryStatus in @/types/api: "wishlist" | "playing" | "finished" |
  // "abandoned", minuscoli). La versione .jsx precedente confrontava contro
  // "WISHLIST"/"IN_CORSO"/"FINITO"/"ABBANDONATO" — valori che non esistono
  // mai nel dato reale, quindi ogni filtro restituiva sempre 0. Bug corretto
  // qui durante la migrazione TSX.
  const stats: Record<StatKey, number> = {
    totalGames: library.length,
    inProgress: library.filter((i) => i.status === "playing").length,
    finished: library.filter((i) => i.status === "finished").length,
    abandoned: library.filter((i) => i.status === "abandoned").length,
    wishlistCount: library.filter((i) => i.status === "wishlist").length,
  };

  const owned = stats.totalGames - stats.wishlistCount;
  const completionRate = owned > 0 ? Math.round((stats.finished / owned) * 100) : 0;

  // "Posseduto" = qualunque voce non in wishlist (playing/finished/abandoned),
  // ognuna con lo status reale mostrato dal badge colorato di LibraryItemCard.
  const ownedGames = library.filter((i) => i.status !== "wishlist");
  const wishlistGames = library.filter((i) => i.status === "wishlist");

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-4">
        <Avatar username={user.username} avatarUrl={avatarUrl} size={64} variant="lime" className="text-2xl" />
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{user.username}</h1>
          <p className="text-sm text-slate-400">{t("stats.title")}</p>
        </div>
      </div>

      {steamLinkMessage && (
        <p className={`text-sm mb-4 ${steamLinkMessage.ok ? "text-vz-lime" : "text-vz-pink"}`}>
          {steamLinkMessage.text}
        </p>
      )}

      {/* Collegamento Steam (docs/OAUTH_LOGIN_PLAN.md, issue #102) — sempre
          un'azione esplicita da qui, mai un auto-match: vedi
          SteamAuthController.link/linkCallback lato backend. */}
      <div className="mb-8">
        {steamLinked ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            🎮 {t("profile.steamLinked")}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              const token = getToken();
              if (token) window.location.href = `${API_BASE_URL}/auth/steam/link?token=${encodeURIComponent(token)}`;
            }}
            className="inline-flex items-center gap-2 text-sm rounded-lg bg-[#1b2838] px-4 py-2 text-white hover:bg-[#2a475e] transition-colors"
          >
            🎮 {t("profile.linkSteam")}
          </button>
        )}
      </div>

      {loading && <p className="text-slate-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {STAT_CARDS.map(({ key, color }) => (
              <div key={key} className="bg-vz-charcoal rounded-xl border border-slate-800 p-4 text-center">
                <p className={`text-3xl font-bold font-display ${color}`}>{stats[key]}</p>
                <p className="text-xs text-slate-500 mt-1">{t(`stats.${key}`)}</p>
              </div>
            ))}
          </div>

          {owned > 0 && (
            <div className="bg-vz-charcoal rounded-xl border border-slate-800 p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">
                  {t("stats.finished")} / {t("nav.library")}
                </span>
                <span className="text-vz-lime font-semibold">{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-vz-lime rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          {myStats && (
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <LibraryCompositionBar
                wishlist={myStats.wishlistCount}
                playing={myStats.playingCount}
                finished={myStats.finishedCount}
                abandoned={myStats.abandonedCount}
              />
              <GenreBarChart data={myStats.gamesByGenre} />
            </div>
          )}

          {leaderboard && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-white">
                  {t("leaderboard.title")}
                </h2>
                <Link to="/leaderboard" className="text-sm text-vz-lime hover:underline">
                  {t("profile.viewFullLeaderboard")} →
                </Link>
              </div>

              <div className="bg-vz-charcoal rounded-xl border border-slate-800 divide-y divide-slate-800">
                {leaderboard.myEntry && (
                  <div className="flex items-center gap-3 p-3 bg-vz-lime/5">
                    <span className="w-8 text-center font-display font-bold text-vz-lime text-sm">
                      #{leaderboard.myEntry.rank}
                    </span>
                    <span className="flex-1 text-white font-medium truncate">
                      {leaderboard.myEntry.username}
                    </span>
                    <span className="text-xs text-slate-400">{t("leaderboard.you")}</span>
                    <span className="text-vz-lime font-semibold text-sm w-14 text-right">
                      {Math.round(leaderboard.myEntry.value / 60)}h
                    </span>
                  </div>
                )}
                {/* Se la propria posizione rientra già nella top N, non ripeterla
                    due volte: la riga evidenziata sopra basta. */}
                {leaderboard.entries
                  .filter((entry) => entry.userId !== leaderboard.myEntry?.userId)
                  .map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-3 p-3">
                    <span className="w-8 text-center font-display font-bold text-slate-400 text-sm">
                      #{entry.rank}
                    </span>
                    <span className="flex-1 text-slate-200 truncate">{entry.username}</span>
                    <span className="text-slate-300 font-semibold text-sm w-14 text-right">
                      {Math.round(entry.value / 60)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-display font-semibold text-white mb-4">
              {t("profile.ownedGames")}
            </h2>
            {ownedGames.length === 0 ? (
              <p className="text-slate-400">{t("profile.emptyOwnedGames")}</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {ownedGames.map((item) => (
                  <LibraryItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>

          {myReviews.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-display font-semibold text-white mb-4">
                {t("profile.myReviews")}
              </h2>
              <div className="space-y-3">
                {myReviews.map((review) => (
                  <Link
                    key={review.id}
                    to="/games/$id"
                    params={{ id: String(review.gameId) }}
                    className="flex items-center gap-3 bg-vz-charcoal rounded-xl border border-slate-800 p-2 hover:border-vz-lime transition-colors"
                  >
                    <img
                      src={review.gameHeaderImageUrl || "https://placehold.co/120x67/111827/ffffff?text=No+Image"}
                      alt={review.gameName}
                      className="w-30 aspect-[92/43] object-cover rounded-lg bg-slate-900 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{review.gameName}</p>
                      <StarRating value={review.rating} />
                      {review.comment && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{review.comment}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-display font-semibold text-white mb-4">
              {t("profile.wishlist")}
            </h2>
            {wishlistGames.length === 0 ? (
              <p className="text-slate-400">{t("profile.emptyWishlist")}</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {wishlistGames.map((item) => (
                  <LibraryItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-white">
                {t("friends.myFriends")}
              </h2>
              <Link to="/friends" className="text-sm text-vz-lime hover:underline">
                {t("friends.title")} →
              </Link>
            </div>
            {friends.length === 0 ? (
              <p className="text-slate-400">{t("friends.noFriends")}</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {friends.map((friend) => {
                  const stats = friendStats[friend.friendId];
                  const friendOwned = stats ? stats.totalGames - stats.wishlistCount : null;
                  return (
                    <div
                      key={friend.friendId}
                      className="flex items-center gap-3 bg-vz-charcoal rounded-xl border border-slate-800 p-3"
                    >
                      <Avatar username={friend.username} avatarUrl={friend.avatarUrl} variant="lime" />
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{friend.username}</p>
                        {stats && (
                          <p className="text-xs text-slate-500">
                            {t("friends.ownedGames")}: {friendOwned} · {t("friends.playingNow")}:{" "}
                            {stats.playingCount}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
