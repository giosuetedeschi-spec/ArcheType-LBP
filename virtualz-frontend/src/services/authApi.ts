import api from "./api";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/api";

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
