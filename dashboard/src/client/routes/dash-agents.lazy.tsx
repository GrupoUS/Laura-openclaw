import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/dash-agents')({
  component: () => <Navigate to="/office" />,
})
