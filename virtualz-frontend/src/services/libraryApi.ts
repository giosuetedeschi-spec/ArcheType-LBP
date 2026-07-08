import api from "./api";
import type { LibraryItem, LibraryStatus } from "@/types/api";

// Endpoint reale confermato leggendo UserGameController.java:
// /api/users/{userId}/games. "/backlog" (usato qui prima) non esiste come
// endpoint nel backend — solo la tabella si chiama "backlog", non c'è
// nessun BacklogController — e restituiva 500 (verificato dal vivo).

/**
 * @param userId id dell'utente
 * @param status filtro opzionale per stato (valori minuscoli: "wishlist", "playing", "finished", "abandoned")
 * @returns le voci di libreria dell'utente
 */
export async function getLibrary(
  userId: number,
  status?: LibraryStatus
): Promise<LibraryItem[]> {
  const { data } = await api.get<LibraryItem[]>(`/users/${userId}/games`, {
    params: status ? { status } : {},
  });
  return data;
}

/**
 * Aggiunge un gioco alla libreria dell'utente con uno stato iniziale.
 * @returns la voce di libreria creata
 */
export async function addToLibrary(
  userId: number,
  payload: { gameId: number; status: LibraryStatus }
): Promise<LibraryItem> {
  const { data } = await api.post<LibraryItem>(`/users/${userId}/games`, payload);
  return data;
}

/**
 * Cambia lo stato di una voce già presente in backlog.
 *
 * @param entryId id della VOCE di backlog (LibraryItem.id), non l'id del
 *                gioco — il backend valida sull'id della riga, non su gameId.
 */
export async function updateLibraryStatus(
  userId: number,
  entryId: number,
  status: LibraryStatus
): Promise<LibraryItem> {
  const { data } = await api.put<LibraryItem>(
    `/users/${userId}/games/${entryId}`,
    { status }
  );
  return data;
}

/**
 * Rimuove una voce dal backlog dell'utente.
 *
 * @param entryId id della VOCE di backlog (LibraryItem.id) — passare per
 *                errore il gameId qui cancellerebbe la voce sbagliata.
 */
export async function removeFromLibrary(userId: number, entryId: number): Promise<void> {
  await api.delete(`/users/${userId}/games/${entryId}`);
}
