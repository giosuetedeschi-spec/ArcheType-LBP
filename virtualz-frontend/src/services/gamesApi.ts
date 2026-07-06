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

// NOTA: questi due endpoint non esistono nel backend ArcheType-LBP
// (verificato oggi con curl: 404/NoResourceFoundException). I generi
// sono solo testo CSV dentro Game.genres, niente catalogo a parte.
// Le funzioni restano per compatibilità futura ma vanno richiamate
// solo se/quando il backend offrirà questi endpoint.

/** @returns elenco generi — richiede un endpoint non ancora presente nel backend */
export async function getGenres(): Promise<string[]> {
  const { data } = await api.get<string[]>("/genres");
  return data;
}

/** @returns elenco categorie — richiede un endpoint non ancora presente nel backend */
export async function getCategories(): Promise<string[]> {
  const { data } = await api.get<string[]>("/categories");
  return data;
}
