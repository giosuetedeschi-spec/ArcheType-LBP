import { createFileRoute } from '@tanstack/react-router'
import GameDetailPage from '@/pages/GameDetailPage'

export const Route = createFileRoute('/games/$id')({
  component: GameDetailPage,
})
