import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getGameById } from "../services/gamesApi";
import { addToLibrary } from "../services/libraryApi";
import { useAuth } from "../context/AuthContext";

export default function GameDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    getGameById(id)
      .then(setGame)
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  async function handleAdd(status) {
    if (!isAuthenticated) return;
    try {
      await addToLibrary(user.id, { gameId: game.id, status });
      setActionMessage(t(`library.status.${status}`));
    } catch (err) {
      setActionMessage(err.response?.data?.message || t("common.error"));
    }
  }

  if (loading) return <p className="text-zinc-400 text-center mt-16">{t("common.loading")}</p>;
  if (error || !game) return <p className="text-vz-pink text-center mt-16">{error || t("common.error")}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <img
        src={game.headerImageUrl}
        alt={game.name}
        className="w-full rounded-xl mb-6 bg-zinc-900 aspect-[16/6] object-cover"
      />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <h1 className="text-3xl font-display font-bold text-white">{game.name}</h1>
        <span className="text-2xl font-bold text-vz-lime">
          {game.price > 0 ? `€${Number(game.price).toFixed(2)}` : t("common.free")}
        </span>
      </div>

      {game.genres?.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {Array.from(game.genres).map((g) => (
            <span key={g} className="text-xs px-3 py-1 rounded-full bg-vz-navy border border-zinc-700 text-zinc-300">
              {g}
            </span>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => handleAdd("WISHLIST")}
            className="px-4 py-2 rounded-full border border-vz-pink text-vz-pink hover:bg-vz-pink/10 transition-colors text-sm font-medium"
          >
            ♥ {t("game.addToWishlist")}
          </button>
          <button
            onClick={() => handleAdd("IN_CORSO")}
            className="px-4 py-2 rounded-full bg-vz-lime text-vz-navy font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("game.addToBacklog")}
          </button>
          <a
            href={`https://store.steampowered.com/app/${game.steamAppId}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full border border-zinc-600 text-zinc-300 hover:text-white transition-colors text-sm"
          >
            {t("game.viewOnSteam")} ↗
          </a>
        </div>
      )}

      {actionMessage && <p className="text-vz-lime text-sm mb-4">{actionMessage}</p>}

      {game.aboutTheGame && <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{game.aboutTheGame}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
        {game.developersRaw && (
          <div>
            <span className="text-zinc-500">{t("game.developers")}: </span>
            <span className="text-zinc-200">{game.developersRaw}</span>
          </div>
        )}
        {game.publishersRaw && (
          <div>
            <span className="text-zinc-500">{t("game.publishers")}: </span>
            <span className="text-zinc-200">{game.publishersRaw}</span>
          </div>
        )}
      </div>
    </div>
  );
}
