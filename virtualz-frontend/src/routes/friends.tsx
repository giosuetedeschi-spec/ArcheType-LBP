import { createFileRoute } from '@tanstack/react-router'
import FriendsPage from '@/pages/FriendsPage'

export const Route = createFileRoute('/friends')({
  component: FriendsPage,
})
