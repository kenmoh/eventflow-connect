import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/roles')({
  server: {
    handlers: {
      PUT: async ({ request }: { request: Request }) => {
        const role = await request.json()
        const { upsertRole } = await import('@/lib/db')
        try {
          await upsertRole(role)
          return Response.json({ success: true })
        } catch (e: any) {
          return Response.json({ error: e?.message ?? 'Save failed' }, { status: 500 })
        }
      },
    },
  },
})
