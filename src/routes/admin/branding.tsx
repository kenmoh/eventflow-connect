import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Branding'

export const Route = createFileRoute('/admin/branding')({
  component: Component,
})
