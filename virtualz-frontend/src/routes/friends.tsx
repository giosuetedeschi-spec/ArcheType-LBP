import { createFileRoute, redirect } from '@tanstack/react-router'
import FriendsPage from '@/pages/FriendsPage'

export const Route = createFileRoute('/friends')({
  beforeLoad: () => {
    const token = localStorage.getItem('virtualz_token')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: FriendsPage,
})
