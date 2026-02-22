import { router, publicProcedure } from '../trpc-init'
import { getAgentDetails } from '../db/queries'

export const dashboardAgentsRouter = router({
  list: publicProcedure.query(async () => {
    const agents = await getAgentDetails()
    return { data: agents, count: agents.length }
  }),
})
