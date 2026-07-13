// Centralizza la lettura/scrittura di token + dati utente, che possono
// vivere in localStorage (sessione ricordata, "resta connesso") o in
// sessionStorage (sessione valida solo finché la scheda resta aperta) —
// vedi AuthContext.login per la scelta tra le due, issue #35.
const TOKEN_KEY = "virtualz_token";
const USER_KEY = "virtualz_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUserJson(): string | null {
  return localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
}

export function persistSession(token: string, userJson: string, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, userJson);
}

// Pulisce entrambi gli storage: dopo il logout (o un 401) nessuna delle
// due sessioni possibili deve restare valida.
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
