import { createFileRoute, redirect } from '@tanstack/react-router'
import LeaderboardPage from '@/pages/LeaderboardPage'
import { getToken } from '@/services/tokenStorage'

interface LeaderboardSearch {
  scope?: string
  metric?: string
  page?: number
}

export const Route = createFileRoute('/leaderboard')({
  validateSearch: (search: Record<string, unknown>): LeaderboardSearch => ({
    scope: typeof search.scope === 'string' ? search.scope : undefined,
    metric: typeof search.metric === 'string' ? search.metric : undefined,
    page: typeof search.page === 'number' ? search.page : undefined,
  }),
  // Richiede login, come /library — vedi routes/library.tsx.
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: LeaderboardPage,
})
