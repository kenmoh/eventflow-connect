import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Hotels'

export const Route = createFileRoute('/admin/hotels')({
  component: Component,
})
