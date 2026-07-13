import { createFileRoute, redirect } from '@tanstack/react-router'
import LibraryPage from '@/pages/LibraryPage'
import { getToken } from '@/services/tokenStorage'

interface LibrarySearch {
  status?: string
}

export const Route = createFileRoute('/library')({
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    status: typeof search.status === 'string' ? search.status : undefined,
  }),
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: LibraryPage,
})
