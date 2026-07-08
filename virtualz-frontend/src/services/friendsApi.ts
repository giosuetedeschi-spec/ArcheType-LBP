import api from "./api";
import type { FriendItem } from "@/types/api";

/** Amici già accettati dell'utente. */
export async function getFriends(userId: number): Promise<FriendItem[]> {
  const { data } = await api.get<FriendItem[]>(`/users/${userId}/friends`);
  return data;
}

/**
 * Richieste di amicizia RICEVUTE dall'utente (in attesa di accettare o
 * rifiutare) — non quelle inviate da lui. Vedi nota in FriendService.java
 * (backend) sul perché la distinzione conta.
 */
export async function getPendingRequests(userId: number): Promise<FriendItem[]> {
  const { data } = await api.get<FriendItem[]>(`/users/${userId}/friends/pending`);
  return data;
}

/** Invia una richiesta di amicizia. */
export async function sendFriendRequest(userId: number, friendId: number): Promise<void> {
  await api.post(`/users/${userId}/friends`, { friendId });
}

/** Accetta una richiesta ricevuta da friendId. */
export async function acceptFriendRequest(userId: number, friendId: number): Promise<void> {
  await api.put(`/users/${userId}/friends/${friendId}/accept`);
}

/** Rifiuta una richiesta ricevuta da friendId. */
export async function rejectFriendRequest(userId: number, friendId: number): Promise<void> {
  await api.put(`/users/${userId}/friends/${friendId}/reject`);
}

/** Rimuove un amico già accettato (o annulla una richiesta inviata). */
export async function removeFriend(userId: number, friendId: number): Promise<void> {
  await api.delete(`/users/${userId}/friends/${friendId}`);
}
