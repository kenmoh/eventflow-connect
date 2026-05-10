import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useStoreBase, useAllowedTabs } from '@/lib/store'

export const Route = createFileRoute('/admin/')({
  component: AdminIndex,
})

function AdminIndex() {
  const allowed = useAllowedTabs()
  const hydrated = useStoreBase(s => s.hydrated)

  if (!hydrated) {
    return (
      <div className="p-10 text-center">
        <h1 className="font-display text-2xl">Loading…</h1>
        <p className="text-muted-foreground">Preparing your admin workspace.</p>
      </div>
    )
  }

  if (allowed.length === 0) {
    return (
      <div className="p-10 text-center">
        <h1 className="font-display text-2xl">No access</h1>
        <p className="text-muted-foreground">You don't have access to any admin tabs.</p>
      </div>
    )
  }

  return <Navigate to={`/admin/${allowed[0]}`} replace />
}
