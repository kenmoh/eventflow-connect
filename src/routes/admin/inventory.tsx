import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Inventory'

export const Route = createFileRoute('/admin/inventory')({
  component: Component,
})
