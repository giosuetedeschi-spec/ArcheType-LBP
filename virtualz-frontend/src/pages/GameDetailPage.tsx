import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { getGameById } from "../services/gamesApi";
import { addToLibrary } from "../services/libraryApi";
import { useAuth } from "../context/AuthContext";
import type { Game, LibraryStatus } from "@/types/api";

/**
 * GameDetailPage — pagina di dettaglio di un singolo gioco (route
 * /games/$id). Mostra copertina, prezzo, generi, dati editoriali e
 * descrizione; se l'utente è autenticato, offre le azioni "aggiungi a
 * wishlist" / "aggiungi al backlog" e un link diretto alla pagina Steam.
 *
 * NOTA sul fix applicato durante la migrazione: i pulsanti di azione
 * chiamavano handleAdd("WISHLIST") / handleAdd("IN_CORSO") — valori
 * maiuscoli/italiani che NON corrispondono al vocabolario reale validato
 * dal backend (vedi LibraryStatus in @/types/api: "wishlist" | "playing" |
 * "finished" | "abandoned", minuscoli). È lo stesso identico bug già
 * trovato e corretto in ProfilePage durante questa migrazione: cliccando
 * questi pulsanti, la richiesta al backend molto probabilmente falliva
 * (o veniva rifiutata dalla validazione @Pattern lato server) in modo
 * silenzioso. Corretto qui usando i valori reali "wishlist" / "playing".
 */
export default function GameDetailPage() {
  const { id } = useParams({ from: "/games/$id" });
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Ricarica il gioco ogni volta che cambia l'id nella route (navigazione
  // tra un dettaglio gioco e l'altro senza smontare il componente).
  useEffect(() => {
    setLoading(true);
    getGameById(Number(id))
      .then(setGame)
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  /**
   * Aggiunge il gioco corrente al backlog dell'utente con lo stato
   * indicato (es. wishlist o playing), mostrando un messaggio di
   * conferma o di errore.
   *
   * @param status - stato iniziale della voce di backlog da creare
   *   (valore reale validato dal backend, vedi nota del componente).
   */
  async function handleAdd(status: LibraryStatus) {
    if (!isAuthenticated || !user || !game) return;
    try {
      await addToLibrary(user.id, { gameId: game.id, status });
      setActionMessage(t(`library.status.${status}`));
    } catch (err) {
      // isAxiosError() stringe il tipo di `err` (unknown in un blocco
      // catch) in modo sicuro, invece di un cast/any — stesso pattern
      // usato in RegisterPage.tsx.
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setActionMessage(message || t("common.error"));
    }
  }

  if (loading) return <p className="text-zinc-400 text-center mt-16">{t("common.loading")}</p>;
  if (error || !game) return <p className="text-vz-pink text-center mt-16">{error || t("common.error")}</p>;

  // Il campo genres arriva dal backend come stringa CSV (es. "Action,RPG"),
  // non come array — va spacchettato qui per il render dei badge sotto.
  const genres = (game.genres || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <img
        src={game.headerImageUrl || "https://placehold.co/1200x600/111827/ffffff?text=No+Image"}
        alt={game.name}
        className="w-full rounded-xl mb-6 bg-zinc-900 aspect-[16/6] object-cover"
      />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <h1 className="text-3xl font-display font-bold text-white">{game.name}</h1>
        <span className="text-2xl font-bold text-vz-lime">
          {Number(game.price || 0) > 0 ? `€${Number(game.price).toFixed(2)}` : t("common.free")}
        </span>
      </div>

      {genres.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {genres.map((g) => (
            <span key={g} className="text-xs px-3 py-1 rounded-full bg-vz-navy border border-zinc-700 text-zinc-300">
              {g}
            </span>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => handleAdd("wishlist")}
            className="px-4 py-2 rounded-full border border-vz-pink text-vz-pink hover:bg-vz-pink/10 transition-colors text-sm font-medium"
          >
            ♥ {t("game.addToWishlist")}
          </button>
          <button
            onClick={() => handleAdd("playing")}
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

      <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
        <div>
          <span className="text-zinc-500">{t("game.developers")}: </span>
          <span className="text-zinc-200">{game.developer || "—"}</span>
        </div>
        <div>
          <span className="text-zinc-500">{t("game.publishers")}: </span>
          <span className="text-zinc-200">{game.publisher || "—"}</span>
        </div>
        <div>
          <span className="text-zinc-500">{t("game.releaseDate")}: </span>
          <span className="text-zinc-200">{game.releaseDate || "—"}</span>
        </div>
        <div>
          <span className="text-zinc-500">{t("game.rating")}: </span>
          <span className="text-zinc-200">{game.rating != null ? `${Number(game.rating).toFixed(1)}/5` : "—"}</span>
        </div>
      </div>

      {game.description && (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <h2 className="text-lg font-semibold text-white mb-3">{t("game.description")}</h2>
          <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{game.description}</p>
        </div>
      )}
    </div>
  );
}
