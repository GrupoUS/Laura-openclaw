import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock resize observer if needed for charts
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
  redirect: vi.fn(),
}))

// Mock NextAuth hooks
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}))
