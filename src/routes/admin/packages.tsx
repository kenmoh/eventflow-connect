import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Packages'

export const Route = createFileRoute('/admin/packages')({
  component: Component,
})
