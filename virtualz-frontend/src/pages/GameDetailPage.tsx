import { useCallback, useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { getGameById } from "../services/gamesApi";
import { addToLibrary, getLibrary } from "../services/libraryApi";
import { getGameReviews, addOrUpdateReview, removeReview } from "../services/reviewsApi";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import GameCoverPlaceholder from "../components/GameCoverPlaceholder";
import type { Game, LibraryItem, LibraryStatus, Review } from "@/types/api";

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
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  // La propria recensione, se già presente — precompila il form invece di
  // mostrarlo vuoto, dato che un nuovo invio la sovrascrive (una sola
  // recensione per utente per gioco, vedi reviewsApi.ts).
  const myReview = reviews.find((r) => r.userId === user?.id) ?? null;

  const fetchReviews = useCallback(() => {
    getGameReviews(Number(id))
      .then(setReviews)
      .catch(() => {
        // Lista recensioni non caricata: non blocca il resto della pagina,
        // la sezione recensioni resta semplicemente vuota.
      });
  }, [id]);

  // Serve a sapere se il gioco è già posseduto (voce di libreria con status
  // diverso da "wishlist"), per mostrare "Gioca" invece di "Compra".
  const fetchLibrary = useCallback(() => {
    if (!user) return;
    getLibrary(user.id)
      .then(setLibrary)
      .catch(() => {
        // Libreria non caricata: il pulsante resta su "Compra" per default.
      });
  }, [user]);

  // Ricarica il gioco ogni volta che cambia l'id nella route (navigazione
  // tra un dettaglio gioco e l'altro senza smontare il componente).
  useEffect(() => {
    setLoading(true);
    getGameById(Number(id))
      .then(setGame)
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
    fetchReviews();
    fetchLibrary();
  }, [id, t, fetchReviews, fetchLibrary]);

  const ownedEntry = game ? library.find((i) => i.game.id === game.id && i.status !== "wishlist") : undefined;

  // Precompila il form quando arriva/cambia la propria recensione esistente.
  useEffect(() => {
    if (myReview) {
      setReviewRating(myReview.rating);
      setReviewComment(myReview.comment ?? "");
    }
  }, [myReview]);

  async function handleSubmitReview() {
    if (!user || !game || reviewRating === 0) return;
    setReviewError(null);
    try {
      await addOrUpdateReview(user.id, { gameId: game.id, rating: reviewRating, comment: reviewComment || null });
      fetchReviews();
    } catch (err) {
      const message = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setReviewError(message || t("common.error"));
    }
  }

  async function handleRemoveReview() {
    if (!user || !myReview) return;
    await removeReview(user.id, myReview.id);
    setReviewRating(0);
    setReviewComment("");
    fetchReviews();
  }

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
      fetchLibrary();
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

  if (loading) return <p className="text-slate-400 text-center mt-16">{t("common.loading")}</p>;
  if (error || !game) return <p className="text-vz-pink text-center mt-16">{error || t("common.error")}</p>;

  // Il campo genres arriva dal backend come stringa CSV (es. "Action,RPG"),
  // non come array — va spacchettato qui per il render dei badge sotto.
  const genres = (game.genres || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {game.headerImageUrl ? (
        <img
          src={game.headerImageUrl}
          alt={game.name}
          className="w-full rounded-xl mb-6 bg-slate-900 aspect-[16/6] object-cover"
        />
      ) : (
        <GameCoverPlaceholder
          name={game.name}
          seed={game.id}
          className="w-full rounded-xl mb-6 aspect-[16/6]"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <h1 className="text-3xl font-display font-bold text-white">{game.name}</h1>
        <span className="text-2xl font-bold text-vz-lime">
          {Number(game.price || 0) > 0 ? `€${Number(game.price).toFixed(2)}` : t("common.free")}
        </span>
      </div>

      {genres.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {genres.map((g) => (
            <span key={g} className="text-xs px-3 py-1 rounded-full bg-vz-navy border border-slate-700 text-slate-300">
              {g}
            </span>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {!ownedEntry && (
            <button
              onClick={() => handleAdd("wishlist")}
              className="px-4 py-2 rounded-full border border-vz-pink text-vz-pink hover:bg-vz-pink/10 transition-colors text-sm font-medium"
            >
              ♥ {t("game.addToWishlist")}
            </button>
          )}
          {ownedEntry ? (
            <a
              href={`https://store.steampowered.com/app/${game.steamAppId}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full bg-vz-lime text-vz-navy font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {t("game.play")} ↗
            </a>
          ) : (
            <>
              <button
                onClick={() => handleAdd("playing")}
                className="px-4 py-2 rounded-full bg-vz-lime text-vz-navy font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("game.buy")}
              </button>
              <a
                href={`https://store.steampowered.com/app/${game.steamAppId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 hover:text-white transition-colors text-sm"
              >
                {t("game.viewOnSteam")} ↗
              </a>
            </>
          )}
        </div>
      )}

      {actionMessage && <p className="text-vz-lime text-sm mb-4">{actionMessage}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
        <div>
          <span className="text-slate-500">{t("game.developers")}: </span>
          <span className="text-slate-200">{game.developer || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">{t("game.publishers")}: </span>
          <span className="text-slate-200">{game.publisher || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">{t("game.releaseDate")}: </span>
          <span className="text-slate-200">{game.releaseDate || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">{t("game.rating")}: </span>
          <span className="text-slate-200">{game.rating != null ? `${Number(game.rating).toFixed(1)}/5` : "—"}</span>
        </div>
      </div>

      {game.description && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-lg font-semibold text-white mb-3">{t("game.description")}</h2>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">{game.description}</p>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">{t("game.reviews")}</h2>
          {reviews.length > 0 && (
            <span className="text-sm text-slate-400">
              ★ {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ·{" "}
              {t("game.reviewsCount", { count: reviews.length })}
            </span>
          )}
        </div>

        {isAuthenticated && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 mb-4">
            <p className="text-sm text-slate-400 mb-2">
              {myReview ? t("game.editYourReview") : t("game.writeReview")}
            </p>
            <StarRating value={reviewRating} onChange={setReviewRating} size="md" />
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t("game.reviewPlaceholder")}
              rows={3}
              className="w-full mt-3 bg-vz-charcoal border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vz-lime resize-none"
            />
            {reviewError && <p className="text-vz-pink text-sm mt-2">{reviewError}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0}
                className="px-4 py-2 rounded-full bg-vz-lime text-vz-navy font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {t("game.submitReview")}
              </button>
              {myReview && (
                <button
                  onClick={handleRemoveReview}
                  className="px-4 py-2 rounded-full text-slate-500 hover:text-vz-pink transition-colors text-sm"
                >
                  {t("game.removeReview")}
                </button>
              )}
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm">{t("game.noReviews")}</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-800 bg-vz-charcoal p-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-white font-medium">{r.username}</span>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && <p className="text-slate-300 text-sm mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
