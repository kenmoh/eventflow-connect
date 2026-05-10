import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Legal'

export const Route = createFileRoute('/admin/legal')({
  component: Component,
})
