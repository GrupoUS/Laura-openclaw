import { Hono } from 'hono'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './trpc'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

// tRPC Provider
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (c) => ({
      gatewayToken: c.req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    })
  })
)

// Health API
app.get('/api/health', (c) => c.json({ ok: true }))

// Static Serving (Production build)
app.use('/*', serveStatic({ root: './dist/public' }))

export default { port: 3000, fetch: app.fetch }
