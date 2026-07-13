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
  /** Età minima consigliata (0 = nessuna restrizione), da "Required age" Steam. */
  requiredAge: number;
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
  /** true = solo giochi con supporto VR (categorie Steam dedicate). */
  vr?: boolean;
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

// Rispecchia UserResponse.java — niente campo "email": rimosso lato
// backend perché questo DTO è restituito anche per l'ID di ALTRI utenti
// (es. GET /api/users, usato qui per la ricerca amici), non solo per il
// proprio profilo.
export interface UserSummary {
  id: number;
  username: string;
  avatarUrl: string | null;
  status: string;
  bio: string | null;
  createdAt: string;
}

// Rispecchia UserStatsResponse.java (GET /api/users/{id}/stats).
export interface UserStats {
  totalGames: number;
  wishlistCount: number;
  playingCount: number;
  finishedCount: number;
  abandonedCount: number;
  gamesByGenre: Record<string, number>;
  gamesByDeveloper: Record<string, number>;
  gamesByYear: Record<string, number>;
  averageRating: number | null;
  totalSpent: number | null;
}

export type FriendStatus = "pending" | "accepted";

// Rispecchia FriendResponse.java. friendId/username/avatarUrl si
// riferiscono sempre "all'altra persona" della relazione — mai a se
// stessi — sia per la lista amici accettati sia per le richieste
// ricevute (vedi nota in FriendService.getPending sul backend).
export interface FriendItem {
  friendId: number;
  username: string;
  avatarUrl: string | null;
  status: FriendStatus;
  createdAt: string;
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

// Rispecchia ReviewResponse.java. Scala 1-5, del tutto separata dal
// Game.rating importato da Steam (vedi Game.rating sopra) — questo è il
// voto scritto da un utente reale.
export interface Review {
  id: number;
  gameId: number;
  gameName: string;
  gameHeaderImageUrl: string | null;
  userId: number;
  username: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPayload {
  gameId: number;
  rating: number;
  comment: string | null;
}
