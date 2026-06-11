import { createFileRoute } from '@tanstack/react-router'
import HotelDetail from '@/pages/HotelDetail'

export const Route = createFileRoute('/hotels/$id')({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — AB Consult` },
      { name: "description", content: `Book ${params.id} at AB Consult. Reserve rooms, event halls and catering for your next event.` },
      { property: "og:title", content: `${params.id} — AB Consult` },
      { property: "og:description", content: `Book ${params.id} at AB Consult. Reserve rooms, event halls and catering.` },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://allbrothersconsult.com/hotels/${params.id}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${params.id} — AB Consult` },
      { name: "twitter:description", content: `Book ${params.id} at AB Consult.` },
    ],
    links: [
      { rel: "canonical", href: `https://allbrothersconsult.com/hotels/${params.id}` },
    ],
  }),
  component: HotelDetail,
})

export function useHotelParams() {
  return Route.useParams()
}