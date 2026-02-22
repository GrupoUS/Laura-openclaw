import { router, publicProcedure } from '../trpc-init'
import { getAgentDetails } from '../db/queries'

export const dashboardAgentsRouter = router({
  list: publicProcedure.query(async () => {
    try {
      const agents = await getAgentDetails()
      return { data: agents, count: agents.length }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`[dashboardAgents.list] Failed to fetch agents: ${message}`, { cause: err })
    }
  }),
})
