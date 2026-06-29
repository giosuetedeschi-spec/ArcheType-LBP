import api from "./api";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/api";

// NOTA: il backend ArcheType-LBP, al momento dell'integrazione di oggi,
// non ha autenticazione implementata lato Spring Security (zero
// AuthController verificato a inizio progetto). L'endpoint /auth/login
// risponde 500 (Internal Server Error), non 404 — quindi esiste un
// AuthController ma fallisce internamente. Da chiarire con il team
// prima di considerare login/register realmente funzionanti.

/**
 * Crea un nuovo account.
 * @returns token JWT + dati utente, da passare a {@link persistSession}
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

/**
 * Autentica un utente esistente.
 * @returns token JWT + dati utente
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}
