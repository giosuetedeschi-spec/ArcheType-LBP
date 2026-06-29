import { createFileRoute, redirect } from '@tanstack/react-router'
import LibraryPage from '@/pages/LibraryPage'

interface LibrarySearch {
  status?: string
}

export const Route = createFileRoute('/library')({
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    status: typeof search.status === 'string' ? search.status : undefined,
  }),
  beforeLoad: () => {
    const token = localStorage.getItem('virtualz_token')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: LibraryPage,
})
