import api from "./api";
import type { UserSummary, UserStats } from "@/types/api";

/**
 * Elenco di tutti gli utenti registrati (GET /api/users — nessun filtro
 * lato backend). Usato per la ricerca "aggiungi amico": il filtro per
 * username avviene lato client, dato il numero contenuto di utenti atteso.
 */
export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>("/users");
  return data;
}

/** Statistiche aggregate di un utente (giochi posseduti, in corso, ecc.). */
export async function getUserStats(userId: number): Promise<UserStats> {
  const { data } = await api.get<UserStats>(`/users/${userId}/stats`);
  return data;
}
