import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Halls'

export const Route = createFileRoute('/admin/halls')({
  component: Component,
})
