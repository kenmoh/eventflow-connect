import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Rooms'

export const Route = createFileRoute('/admin/rooms')({
  component: Component,
})
