import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Setup semplice: solo TanStack Router (client-side, SPA), niente
// TanStack Start / SSR / Nitro / Lovable wrapper. Per Docker self-hosted
// con Nginx, basta una build statica.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  base: "/",
});
