import api from "./api";
import type { LibraryItem, LibraryStatus } from "@/types/api";

// Endpoint reale confermato dal codice sorgente del backend
// (BacklogController.java): /api/users/{userId}/backlog.
// Esiste anche /api/users/{userId}/games (UserGameController) che opera
// sulla stessa tabella — i due endpoint sono storicamente duplicati,
// "backlog" è quello con più funzionalità (note, tempo di gioco) ed è
// quello scelto qui.

/**
 * @param userId id dell'utente
 * @param status filtro opzionale per stato (valori minuscoli: "wishlist", "playing", "finished", "abandoned")
 * @returns le voci di backlog dell'utente
 */
export async function getLibrary(
  userId: number,
  status?: LibraryStatus
): Promise<LibraryItem[]> {
  const { data } = await api.get<LibraryItem[]>(`/users/${userId}/backlog`, {
    params: status ? { status } : {},
  });
  return data;
}

/**
 * Aggiunge un gioco al backlog dell'utente con uno stato iniziale.
 * @returns la voce di backlog creata
 */
export async function addToLibrary(
  userId: number,
  payload: { gameId: number; status: LibraryStatus }
): Promise<LibraryItem> {
  const { data } = await api.post<LibraryItem>(`/users/${userId}/backlog`, payload);
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
    `/users/${userId}/backlog/${entryId}`,
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
  await api.delete(`/users/${userId}/backlog/${entryId}`);
}
