import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/context/AuthContext'
import { ColorblindProvider } from '@/context/ColorblindContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MouseTrail from "@/components/MouseTrail";

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ColorblindProvider>
          {/* Scia mouse trail, copre l'intera applicazione */}
          <MouseTrail />
          {/* min-h-screen + flex flex-col permettono al Footer di stare
              sempre in fondo alla pagina, anche se il contenuto è corto */}
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
        </ColorblindProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}