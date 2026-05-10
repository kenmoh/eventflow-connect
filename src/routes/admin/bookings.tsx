import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Bookings'

export const Route = createFileRoute('/admin/bookings')({
  component: Component,
})
