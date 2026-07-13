import axios from "axios";
import { getToken, clearSession } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Il backend (ArcheType-LBP) incapsula sempre le risposte in
// { success, data, message }. Qui spacchettiamo automaticamente
// quella busta, cosi' gamesApi.ts/libraryApi.ts continuano a fare
// `const { data } = await api.get(...)` e ricevono già il payload vero.
interface BackendEnvelope {
  success: boolean;
  data: unknown;
  message: string | null;
}

function isBackendEnvelope(value: unknown): value is BackendEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value
  );
}

api.interceptors.response.use(
  (response) => {
    if (isBackendEnvelope(response.data)) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(error);
  }
);

export default api;
