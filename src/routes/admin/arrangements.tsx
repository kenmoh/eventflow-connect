import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Arrangements'

export const Route = createFileRoute('/admin/arrangements')({
  component: Component,
})
