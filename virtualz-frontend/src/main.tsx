import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import './i18n'
import { routeTree } from './routeTree.gen'

/**
 * Global loading component shown during route transitions.
 * Uses Tailwind CSS animations (no external libraries).
 * Respects prefers-reduced-motion accessibility setting.
 */
function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"
          aria-hidden="true"
        />
        <p className="text-white text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: RouteLoading,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
}
