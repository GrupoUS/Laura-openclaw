import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/orchestration')({
  component: () => <Navigate to="/office" />,
})
