import { createFileRoute } from '@tanstack/react-router'
import Component from '@/pages/admin/Employees'

export const Route = createFileRoute('/admin/employees')({
  component: Component,
})
