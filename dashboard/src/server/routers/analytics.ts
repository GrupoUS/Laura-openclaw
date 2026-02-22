import { router, publicProcedure } from '../trpc-init'
import { getAnalytics } from '../db/queries'

export const analyticsRouter = router({
  get: publicProcedure.query(async () => {
    const data = await getAnalytics()
    return { data, generatedAt: new Date().toISOString() }
  }),
})
