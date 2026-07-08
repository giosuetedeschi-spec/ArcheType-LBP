import api from "./api";
import type { Review, ReviewPayload } from "@/types/api";

/** Tutte le recensioni di un gioco (endpoint pubblico, nessun login richiesto). */
export async function getGameReviews(gameId: number): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/games/${gameId}/reviews`);
  return data;
}

/** Tutte le recensioni scritte da un utente, su qualsiasi gioco. */
export async function getUserReviews(userId: number): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/users/${userId}/reviews`);
  return data;
}

/**
 * Crea o aggiorna la recensione dell'utente per un gioco — una sola per
 * utente per gioco (UNIQUE lato DB): un nuovo invio sullo stesso gameId
 * sovrascrive la propria, non ne crea una seconda.
 */
export async function addOrUpdateReview(userId: number, payload: ReviewPayload): Promise<Review> {
  const { data } = await api.post<Review>(`/users/${userId}/reviews`, payload);
  return data;
}

/** Rimuove una propria recensione (reviewId, non gameId). */
export async function removeReview(userId: number, reviewId: number): Promise<void> {
  await api.delete(`/users/${userId}/reviews/${reviewId}`);
}
