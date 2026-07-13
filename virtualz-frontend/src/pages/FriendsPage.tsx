import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useAuth } from "../context/AuthContext";
import { listUsers, getUserStats } from "../services/usersApi";
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../services/friendsApi";
import type { FriendItem, UserStats, UserSummary } from "@/types/api";

function extractErrorMessage(err: unknown, fallback: string): string {
  return isAxiosError<{ message?: string }>(err) ? err.response?.data?.message || fallback : fallback;
}

/**
 * AvatarCircle — stesso pattern di iniziale-in-cerchio già usato in
 * Navbar/ProfilePage. avatarUrl non è mai valorizzato nei dati attuali
 * (sempre null), quindi non c'è un fallback a immagine da gestire qui.
 */
function AvatarCircle({ username }: { username: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-vz-lime text-vz-navy flex items-center justify-center font-bold font-display shrink-0">
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pending, setPending] = useState<FriendItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [statsByUserId, setStatsByUserId] = useState<Record<number, UserStats>>({});
  const [pendingListRef] = useAutoAnimate();
  const [friendsListRef] = useAutoAnimate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [friendsResult, pendingResult, usersResult] = await Promise.all([
        getFriends(user.id),
        getPendingRequests(user.id),
        listUsers(),
      ]);
      setFriends(friendsResult);
      setPending(pendingResult);
      setAllUsers(usersResult);

      // Statistiche per ogni amico, in parallelo — usate per mostrare
      // "giochi posseduti" e "in corso" accanto al nome.
      const statsEntries = await Promise.all(
        friendsResult.map(async (f) => [f.friendId, await getUserStats(f.friendId)] as const)
      );
      setStatsByUserId(Object.fromEntries(statsEntries));
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Risultati di ricerca: utenti il cui username combacia con la query,
  // esclusi se stessi e chi è già amico accettato (non ha senso "aggiungere"
  // di nuovo qualcuno già in lista amici).
  const searchResults = useMemo(() => {
    if (!user || searchQuery.trim() === "") return [];
    const q = searchQuery.trim().toLowerCase();
    const friendIds = new Set(friends.map((f) => f.friendId));
    return allUsers.filter(
      (u) => u.id !== user.id && !friendIds.has(u.id) && u.username.toLowerCase().includes(q)
    );
  }, [allUsers, friends, searchQuery, user]);

  async function handleAdd(candidateId: number) {
    if (!user) return;
    setActionMessage(null);
    try {
      await sendFriendRequest(user.id, candidateId);
      setActionMessage(t("friends.requestSent"));
    } catch (err) {
      setActionMessage(extractErrorMessage(err, t("common.error")));
    }
  }

  async function handleAccept(friendId: number) {
    if (!user) return;
    await acceptFriendRequest(user.id, friendId);
    fetchAll();
  }

  async function handleReject(friendId: number) {
    if (!user) return;
    await rejectFriendRequest(user.id, friendId);
    fetchAll();
  }

  async function handleRemove(friendId: number) {
    if (!user) return;
    await removeFriend(user.id, friendId);
    fetchAll();
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-white mb-6">{t("friends.title")}</h1>

      {/* --- Ricerca / aggiungi amici --- */}
      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("friends.searchPlaceholder")}
          className="w-full bg-vz-charcoal border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vz-lime"
        />

        {actionMessage && <p className="text-sm text-vz-lime mt-2">{actionMessage}</p>}

        {searchQuery.trim() !== "" && (
          <div className="mt-3 space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-500">{t("friends.searchNoResults")}</p>
            ) : (
              searchResults.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between gap-3 bg-vz-charcoal rounded-xl border border-slate-800 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarCircle username={candidate.username} />
                    <span className="text-white font-medium truncate">{candidate.username}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(candidate.id)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("friends.add")}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {loading && <p className="text-slate-400">{t("common.loading")}</p>}
      {error && <p className="text-vz-pink">{error}</p>}

      {!loading && !error && (
        <>
          {/* --- Richieste ricevute --- */}
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-display font-semibold text-white mb-3">
                {t("friends.requestsReceived")}
              </h2>
              <div ref={pendingListRef} className="space-y-2">
                {pending.map((req) => (
                  <div
                    key={req.friendId}
                    className="flex items-center justify-between gap-3 bg-vz-charcoal rounded-xl border border-slate-800 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarCircle username={req.username} />
                      <span className="text-white font-medium truncate">{req.username}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAccept(req.friendId)}
                        className="text-xs px-3 py-1.5 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
                      >
                        {t("friends.accept")}
                      </button>
                      <button
                        onClick={() => handleReject(req.friendId)}
                        className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-400 hover:text-white transition-colors"
                      >
                        {t("friends.reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- Lista amici --- */}
          <div>
            <h2 className="text-lg font-display font-semibold text-white mb-3">{t("friends.myFriends")}</h2>
            {friends.length === 0 ? (
              <p className="text-slate-400">{t("friends.noFriends")}</p>
            ) : (
              <div ref={friendsListRef} className="space-y-2">
                {friends.map((friend) => {
                  const stats = statsByUserId[friend.friendId];
                  const owned = stats ? stats.totalGames - stats.wishlistCount : null;
                  return (
                    <div
                      key={friend.friendId}
                      className="flex items-center justify-between gap-3 bg-vz-charcoal rounded-xl border border-slate-800 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarCircle username={friend.username} />
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{friend.username}</p>
                          {stats && (
                            <p className="text-xs text-slate-500">
                              {t("friends.ownedGames")}: {owned} · {t("friends.playingNow")}: {stats.playingCount}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(friend.friendId)}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-full text-slate-500 hover:text-vz-pink transition-colors"
                      >
                        {t("friends.remove")}
                      </button>
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
