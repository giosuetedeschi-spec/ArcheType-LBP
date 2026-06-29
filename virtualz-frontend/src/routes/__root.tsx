import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/context/AuthContext'
import { ColorblindProvider } from '@/context/ColorblindContext'
import Navbar from '@/components/Navbar'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ColorblindProvider>
        <div className="min-h-screen">
          <Navbar />
          <main>
            <Outlet />
          </main>
        </div>
      </ColorblindProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
