import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { getLibrary, updateLibraryStatus, removeFromLibrary } from "../services/libraryApi";
import { getFriends } from "../services/friendsApi";
import { getUserStats } from "../services/usersApi";
import { useAuth } from "../context/AuthContext";
import LibraryItemCard from "../components/LibraryItemCard";
import type { FriendItem, LibraryItem, LibraryStatus, UserStats } from "@/types/api";

// STAT_CARDS.key deve combaciare con le chiavi dell'oggetto `stats` più sotto
type StatKey = "totalGames" | "inProgress" | "finished" | "abandoned" | "wishlistCount";

const STAT_CARDS: { key: StatKey; color: string }[] = [
  { key: "totalGames", color: "text-white" },
  { key: "inProgress", color: "text-blue-300" },
  { key: "finished", color: "text-vz-lime" },
  { key: "abandoned", color: "text-zinc-400" },
  { key: "wishlistCount", color: "text-vz-pink" },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [friendStats, setFriendStats] = useState<Record<number, UserStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ProfilePage è raggiungibile solo da utente autenticato (route protetta),
  // ma TypeScript non lo sa: user può essere null per tipo. Guard esplicita
  // invece di un cast, per restare onesti col compilatore.
  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    try {
      const [libraryResult, friendsResult] = await Promise.all([
        getLibrary(user.id),
        getFriends(user.id),
      ]);
      setLibrary(libraryResult);
      setFriends(friendsResult);

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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-vz-lime text-vz-navy flex items-center justify-center text-2xl font-bold font-display">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{user.username}</h1>
          <p className="text-sm text-zinc-400">{t("stats.title")}</p>
        </div>
      </div>

      {loading && <p className="text-zinc-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {STAT_CARDS.map(({ key, color }) => (
              <div key={key} className="bg-vz-charcoal rounded-xl border border-zinc-800 p-4 text-center">
                <p className={`text-3xl font-bold font-display ${color}`}>{stats[key]}</p>
                <p className="text-xs text-zinc-500 mt-1">{t(`stats.${key}`)}</p>
              </div>
            ))}
          </div>

          {owned > 0 && (
            <div className="bg-vz-charcoal rounded-xl border border-zinc-800 p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-300">
                  {t("stats.finished")} / {t("nav.library")}
                </span>
                <span className="text-vz-lime font-semibold">{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-vz-lime rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-display font-semibold text-white mb-4">
              {t("profile.ownedGames")}
            </h2>
            {ownedGames.length === 0 ? (
              <p className="text-zinc-400">{t("profile.emptyOwnedGames")}</p>
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

          {/*
            TODO(wishlist): sezione in arrivo, implementata da un collega.
            Stesso pattern della sezione "Giochi posseduti" sopra, filtro
            opposto: library.filter((i) => i.status === "wishlist") invece
            di !== "wishlist". Riusa LibraryItemCard (già gestisce lo status
            "wishlist" col bottone "Sposta nel Backlog") e fetchLibrary()
            già presente in questo componente — non serve una nuova chiamata
            API, i dati sono già tutti in `library`.
          */}

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
              <p className="text-zinc-400">{t("friends.noFriends")}</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {friends.map((friend) => {
                  const stats = friendStats[friend.friendId];
                  const friendOwned = stats ? stats.totalGames - stats.wishlistCount : null;
                  return (
                    <div
                      key={friend.friendId}
                      className="flex items-center gap-3 bg-vz-charcoal rounded-xl border border-zinc-800 p-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-vz-lime text-vz-navy flex items-center justify-center font-bold font-display shrink-0">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{friend.username}</p>
                        {stats && (
                          <p className="text-xs text-zinc-500">
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
