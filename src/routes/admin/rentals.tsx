import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Rentals'

export const Route = createFileRoute('/admin/rentals')({
  component: Component,
})
