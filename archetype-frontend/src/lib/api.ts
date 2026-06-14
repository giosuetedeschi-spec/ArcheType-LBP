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
};
