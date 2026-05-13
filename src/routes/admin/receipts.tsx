import { createFileRoute } from '@tanstack/react-router'
import AdminReceipts from '@/pages/admin/Receipts'

export const Route = createFileRoute('/admin/receipts')({
  component: AdminReceipts,
})