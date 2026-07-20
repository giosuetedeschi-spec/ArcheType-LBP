import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as authApi from "../services/authApi";
import { getStoredUserJson, persistSession as storeSession, clearSession } from "../services/tokenStorage";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/api";

// Utente minimale salvato in sessione (non il DTO completo del backend)
interface User {
  id: number;
  username: string;
}

interface AuthContextValue {
  user: User | null;
  login: (credentials: LoginPayload, remember: boolean) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  // Apre la sessione da un token già emesso dal backend (login Steam via
  // redirect, OAuthCallbackPage) — a differenza di login()/register(), non
  // chiama nessuna API: il token/userId/username arrivano già pronti nella
  // query string del redirect, vedi SteamAuthController.callback().
  completeOAuthLogin: (authResponse: AuthResponse, remember: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  persistSession: (authResponse: AuthResponse, remember: boolean) => void; // <--- AGGIUNGI QUESTA RIGA
}

const AuthContext = createContext<AuthContextValue | null>(null);

// AuthProvider — gestisce sessione utente (login/logout/registrazione),
// persistita in localStorage o sessionStorage (vedi tokenStorage.ts). Va
// montato in routes/__root.tsx, sopra Navbar.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Stato utente: ripristinato al primo render (sopravvive al refresh),
  // da localStorage o sessionStorage a seconda di dove login() l'ha salvato.
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredUserJson();
    return stored ? (JSON.parse(stored) as User) : null;
  });

  // Salva token + dati utente dopo login/registrazione riusciti
  const persistSession = useCallback((authResponse: AuthResponse, remember: boolean) => {
    const userData: User = { id: authResponse.userId, username: authResponse.username };
    storeSession(authResponse.token, JSON.stringify(userData), remember);
    setUser(userData);
  }, []);

  // Login: chiama il backend, poi salva la sessione dove richiesto dall'utente
  const login = useCallback(
    async (credentials: LoginPayload, remember: boolean) => {
      const response = await authApi.login(credentials);
      persistSession(response, remember);
      return response;
    },
    [persistSession]
  );

  // Registrazione: stesso flusso del login, account nuovo. Nessuna scelta
  // "resta connesso" qui (checkbox solo su LoginPage) — comportamento
  // precedente invariato, sempre ricordata.
  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      persistSession(response, true);
      return response;
    },
    [persistSession]
  );

  // Logout: pulisce token e dati utente da entrambi gli storage
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
<AuthContext.Provider
      value={{ 
        user, 
        login, 
        register, 
        completeOAuthLogin: persistSession, 
        persistSession, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
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
