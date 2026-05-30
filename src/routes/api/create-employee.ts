import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/create-employee')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { name, email, password, roleId } = await request.json()

        if (!name || !email) {
          return Response.json({ error: 'Name and email are required' }, { status: 400 })
        }

        try {
          const { createClerkClient } = await import('@clerk/backend')
          const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

          const names = name.trim().split(/\s+/)
          const firstName = names[0] || ''
          const lastName = names.slice(1).join(' ') || ''

          const user = await clerk.users.createUser({
            emailAddress: [email],
            password,
            firstName,
            lastName,
            skipPasswordRequirement: !password,
            skipPasswordChecks: true,
          })

          const emailId = user.emailAddresses?.[0]?.id
          if (emailId) {
            await fetch(`https://api.clerk.com/v1/email_addresses/${emailId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` },
              body: JSON.stringify({ verified: true }),
            })
          }

          const { getDb } = await import('@/db/client')
          const { profiles } = await import('@/db/schema')
          await getDb().insert(profiles).values({ id: user.id, name, email }).onConflictDoNothing()

          if (roleId) {
            const { setEmployeeRole } = await import('@/lib/db')
            await setEmployeeRole(user.id, roleId)
          }

          return Response.json({ success: true, id: user.id })
        } catch (e: any) {
          console.error('Create employee error:', e)
          return Response.json({ error: e?.errors?.[0]?.message || e?.message || 'Create failed' }, { status: 500 })
        }
      },
    },
  },
})
