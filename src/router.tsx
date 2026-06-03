// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // Increase stream timeout to handle Neon cold starts (default is 120s, we set 30s
    // so the server fails fast and falls back to client-side rendering instead of hanging)
    defaultStreamMaxTime: 30_000,
  })

  return router
}