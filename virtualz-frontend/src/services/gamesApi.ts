import api from "./api";
import type { CatalogSearchParams, Game, PagedResponse } from "@/types/api";

/**
 * Ricerca paginata nel catalogo, con filtri opzionali (nome, genere,
 * sviluppatore, range prezzo/voto, intervallo date, ordinamento).
 *
 * @param params criteri di ricerca/paginazione; vuoto = prima pagina senza filtri
 * @returns pagina di giochi corrispondenti
 */
export async function searchCatalog(
  params: CatalogSearchParams = {}
): Promise<PagedResponse<Game>> {
  const { data } = await api.get<PagedResponse<Game>>("/games/filter", { params });
  return data;
}

/**
 * @param id id interno del gioco (non lo Steam AppID)
 * @returns il gioco corrispondente
 */
export async function getGameById(id: number): Promise<Game> {
  const { data } = await api.get<Game>(`/games/${id}`);
  return data;
}

/**
 * @param mature true = includi anche i generi per adulti (Nudity/Sexual
 *   Content), coerente con il flag equivalente di searchCatalog — di
 *   default restano fuori dalla lista, vedi GenreController lato backend.
 * @returns elenco generi distinti presenti a catalogo, ordinati alfabeticamente
 */
export async function getGenres(mature = false): Promise<string[]> {
  const { data } = await api.get<string[]>("/genres", { params: mature ? { mature: true } : {} });
  return data;
}

/** @returns elenco categorie distinte presenti a catalogo, ordinate alfabeticamente */
export async function getCategories(): Promise<string[]> {
  const { data } = await api.get<string[]>("/categories");
  return data;
}
