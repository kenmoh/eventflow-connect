import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Faqs'

export const Route = createFileRoute('/admin/faqs')({
  component: Component,
})
