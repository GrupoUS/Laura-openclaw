import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/agents')({
  component: () => <Navigate to="/office" />,
})
