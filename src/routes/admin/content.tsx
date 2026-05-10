import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Content'

export const Route = createFileRoute('/admin/content')({
  component: Component,
})
