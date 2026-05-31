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
      <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full mb-4" />
        <h1 className="font-display text-2xl">Preparing Workspace</h1>
        <p className="text-muted-foreground text-sm">Syncing your data from the database.</p>
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
