import { createFileRoute, redirect } from '@tanstack/react-router'
import ProfilePage from '@/pages/ProfilePage'
import { getToken } from '@/services/tokenStorage'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    const token = getToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProfilePage,
})
