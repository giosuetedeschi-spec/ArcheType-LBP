// Tipi che rispecchiano esattamente le risposte reali del backend
// ArcheType-LBP (verificate con curl durante l'integrazione di oggi).
// Il backend incapsula sempre in { success, data, message }, ma
// l'interceptor in api.ts lo spacchetta già — qui tipizziamo solo
// il payload vero (T), non la busta.

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Game {
  id: number;
  steamAppId: number;
  name: string;
  releaseDate: string | null;
  /** Stringa semplice (es. "Valve"), non un oggetto relazionale */
  developer: string | null;
  publisher: string | null;
  price: number;
  rating: number | null;
  /** CSV (es. "RPG,Action") — va splittato a mano, non è un array */
  genres: string | null;
  description: string | null;
  headerImageUrl: string | null;
  windows: boolean;
  mac: boolean;
  linux: boolean;
  createdAt: string;
}

export interface CatalogSearchParams {
  page?: number;
  size?: number;
  name?: string;
  genre?: string;
  developer?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  /** Valori: "windows" | "mac" | "linux". Più valori = OR lato backend. */
  os?: string[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

// Valori reali accettati dal backend (vedi BacklogRequest.java,
// validazione @Pattern) — minuscoli, non "WISHLIST"/"IN_CORSO" come si
// potrebbe immaginare guardando solo il nome delle costanti lato UI.
export type LibraryStatus = "wishlist" | "playing" | "finished" | "abandoned";

export interface LibraryGameSummary {
  id: number;
  name: string;
  headerImageUrl: string | null;
  developer: string | null;
}

// Rispecchia BacklogResponse.java — "id" qui è l'id della VOCE di backlog,
// non del gioco. Va sempre questo id (non game.id) quando si chiama
// updateLibraryStatus/removeFromLibrary, altrimenti si rischia di
// modificare/cancellare la voce sbagliata (bug reale già trovato e
// corretto nello stesso punto sul frontend del team).
export interface LibraryItem {
  id: number;
  userId: number;
  game: LibraryGameSummary;
  status: LibraryStatus;
  playTimeMin: number | null;
  notes: string | null;
  addedAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
}

// Il backend (AuthRequest.java) accetta solo "username" (nessun lookup
// per email) — il nome del campo qui deve combaciare esattamente.
export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

// Rispecchia LeaderboardEntryResponse.java.
export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  value: number;
}

// "local" non è ancora supportato lato backend (manca il campo regione
// sull'utente) — vedi LeaderboardFilterRequest.java.
export type LeaderboardScope = "global" | "friends";
export type LeaderboardMetric = "hours" | "games" | "friends";

export interface LeaderboardParams {
  userId: number;
  scope: LeaderboardScope;
  metric: LeaderboardMetric;
  page?: number;
  size?: number;
}

// Rispecchia LeaderboardResponse.java — myEntry è la posizione di chi ha
// fatto la richiesta, calcolata su tutta la classifica (non solo sulla
// pagina corrente), quindi va mostrata anche se non compare in "entries".
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  myEntry: LeaderboardEntry | null;
}
