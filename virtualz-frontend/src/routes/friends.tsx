import { createFileRoute, redirect } from '@tanstack/react-router'
import FriendsPage from '@/pages/FriendsPage'
import { getToken } from '@/services/tokenStorage'

export const Route = createFileRoute('/friends')({
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: FriendsPage,
})
