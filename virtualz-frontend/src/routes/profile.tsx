import { createFileRoute, redirect } from '@tanstack/react-router'
import ProfilePage from '@/pages/ProfilePage'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    const token = localStorage.getItem('virtualz_token')
    if (!token) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProfilePage,
})
