// API service - connects to Spring Boot backend
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface Game {
  id: number;
  steamAppId: number;
  name: string;
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  price?: number;
  rating?: number;
  genres?: string;
  description?: string;
  headerImageUrl?: string;
  multiplayer?: boolean;
}

export interface GameFilterRequest {
  search?: string;
  genre?: string;
  developer?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  releasedAfter?: string;
  releasedBefore?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}

export interface PagedResponse {
  content: Game[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserGame {
  id: number;
  userId: number;
  gameId: number;
  status: "wishlist" | "playing" | "finished" | "abandoned";
  addedAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Games API
export const gameApi = {
  list: () => fetchJSON<Game[]>(`${API_BASE}/games`),
  get: (id: number) => fetchJSON<Game>(`${API_BASE}/games/${id}`),
  create: (game: Partial<Game>) => fetchJSON<Game>(`${API_BASE}/games`, { method: "POST", body: JSON.stringify(game) }),
  update: (id: number, game: Partial<Game>) => fetchJSON<Game>(`${API_BASE}/games/${id}`, { method: "PUT", body: JSON.stringify(game) }),
  delete: (id: number) => fetchJSON<void>(`${API_BASE}/games/${id}`, { method: "DELETE" }),
  search: (q: string) => fetchJSON<Game[]>(`${API_BASE}/games/search?q=${encodeURIComponent(q)}`),
  filter: (req: GameFilterRequest) => {
    const params = new URLSearchParams();
    if (req.search) params.set("name", req.search);
    if (req.genre) params.set("genre", req.genre);
    if (req.developer) params.set("developer", req.developer);
    if (req.minPrice != null) params.set("minPrice", String(req.minPrice));
    if (req.maxPrice != null) params.set("maxPrice", String(req.maxPrice));
    if (req.minRating != null) params.set("minRating", String(req.minRating));
    if (req.releasedAfter) params.set("releasedAfter", req.releasedAfter);
    if (req.releasedBefore) params.set("releasedBefore", req.releasedBefore);
    if (req.sortBy) params.set("sortBy", req.sortBy);
    if (req.sortDir) params.set("sortDir", req.sortDir);
    if (req.page != null) params.set("page", String(req.page));
    if (req.size != null) params.set("size", String(req.size));
    return fetchJSON<PagedResponse>(`${API_BASE}/games/filter?${params.toString()}`);
  },
};

// User Games API
export const userGameApi = {
  list: (userId: number) => fetchJSON<UserGame[]>(`${API_BASE}/users/${userId}/games`),
  add: (userId: number, gameId: number, status: string) =>
    fetchJSON<UserGame>(`${API_BASE}/users/${userId}/games`, { method: "POST", body: JSON.stringify({ gameId, status }) }),
  update: (userId: number, id: number, status: string) =>
    fetchJSON<UserGame>(`${API_BASE}/users/${userId}/games/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
  remove: (userId: number, id: number) =>
    fetchJSON<void>(`${API_BASE}/users/${userId}/games/${id}`, { method: "DELETE" }),
};

// Users API
export const userApi = {
  list: () => fetchJSON<User[]>(`${API_BASE}/users`),
  get: (id: number) => fetchJSON<User>(`${API_BASE}/users/${id}`),
  create: (user: Partial<User> & { password: string }) => fetchJSON<User>(`${API_BASE}/users`, { method: "POST", body: JSON.stringify(user) }),
  update: (id: number, body: { avatarUrl?: string; status?: string; bio?: string }) =>
    fetchJSON<User>(`${API_BASE}/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

// Stats API
export const statsApi = {
  get: (userId: number) => fetchJSON<{
    totalGames: number;
    wishlistCount: number;
    playingCount: number;
    finishedCount: number;
    abandonedCount: number;
    gamesByGenre: Record<string, number>;
    gamesByDeveloper: Record<string, number>;
    gamesByYear: Record<string, number>;
    averageRating: number;
    totalSpent: number;
  }>(`${API_BASE}/users/${userId}/stats`),
};

// Friends API
export const friendsApi = {
  list: (userId: number) => fetchJSON<{ friendId: number; username: string; avatarUrl?: string; status: string; createdAt: string }[]>(`${API_BASE}/users/${userId}/friends`),
  pending: (userId: number) => fetchJSON<{ friendId: number; username: string; avatarUrl?: string; status: string; createdAt: string }[]>(`${API_BASE}/users/${userId}/friends/pending`),
  add: (userId: number, friendId: number) =>
    fetchJSON<void>(`${API_BASE}/users/${userId}/friends`, { method: "POST", body: JSON.stringify({ friendId }) }),
  update: (userId: number, friendId: number, action: string) =>
    fetchJSON<void>(`${API_BASE}/users/${userId}/friends/${friendId}`, { method: "PUT", body: JSON.stringify({ action }) }),
  remove: (userId: number, friendId: number) =>
    fetchJSON<void>(`${API_BASE}/users/${userId}/friends/${friendId}`, { method: "DELETE" }),
};
