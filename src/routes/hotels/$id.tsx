import { createFileRoute } from '@tanstack/react-router'
import HotelDetail from '@/pages/HotelDetail'

export const Route = createFileRoute('/hotels/$id')({
  component: HotelDetail,
})

export function useHotelParams() {
  return Route.useParams()
}