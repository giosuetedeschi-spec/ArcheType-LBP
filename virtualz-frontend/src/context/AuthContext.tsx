import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as authApi from "../services/authApi";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/api";

// Utente minimale salvato in sessione (non il DTO completo del backend)
interface User {
  id: number;
  username: string;
}

// Forma del valore esposto da useAuth() a tutti i componenti
interface AuthContextValue {
  user: User | null;
  login: (credentials: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// AuthProvider — gestisce sessione utente (login/logout/registrazione),
// persistita in localStorage. Va montato in routes/__root.tsx, sopra Navbar.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Stato utente: ripristinato da localStorage al primo render (sopravvive al refresh)
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("virtualz_user");
    return stored ? (JSON.parse(stored) as User) : null;
  });

  // Salva token + dati utente dopo login/registrazione riusciti
  const persistSession = useCallback((authResponse: AuthResponse) => {
    localStorage.setItem("virtualz_token", authResponse.token);
    const userData: User = { id: authResponse.userId, username: authResponse.username };
    localStorage.setItem("virtualz_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Login: chiama il backend, poi salva la sessione
  const login = useCallback(
    async (credentials: LoginPayload) => {
      const response = await authApi.login(credentials);
      persistSession(response);
      return response;
    },
    [persistSession]
  );

  // Registrazione: stesso flusso del login, account nuovo
  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      persistSession(response);
      return response;
    },
    [persistSession]
  );

  // Logout: pulisce token e dati utente, sia da localStorage che dallo stato
  const logout = useCallback(() => {
    localStorage.removeItem("virtualz_token");
    localStorage.removeItem("virtualz_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth — hook di accesso al context. Lancia un errore esplicito se usato
// fuori da <AuthProvider>, invece di restituire un valore vuoto in silenzio.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return ctx;
}
