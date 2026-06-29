import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLibrary } from "../services/libraryApi";
import { useAuth } from "../context/AuthContext";

const STAT_CARDS = [
  { key: "totalGames", color: "text-white" },
  { key: "inProgress", color: "text-blue-300" },
  { key: "finished", color: "text-vz-lime" },
  { key: "abandoned", color: "text-zinc-400" },
  { key: "wishlistCount", color: "text-vz-pink" },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLibrary(user.id)
      .then(setLibrary)
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [user.id, t]);

  const stats = {
    totalGames: library.length,
    inProgress: library.filter((i) => i.status === "IN_CORSO").length,
    finished: library.filter((i) => i.status === "FINITO").length,
    abandoned: library.filter((i) => i.status === "ABBANDONATO").length,
    wishlistCount: library.filter((i) => i.status === "WISHLIST").length,
  };

  const owned = stats.totalGames - stats.wishlistCount;
  const completionRate = owned > 0 ? Math.round((stats.finished / owned) * 100) : 0;

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
        </>
      )}
    </div>
  );
}
