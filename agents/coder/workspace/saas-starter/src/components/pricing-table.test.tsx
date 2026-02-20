import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PricingTable } from './pricing-table'

// Mock Server Actions
vi.mock('@/lib/actions', () => ({
  createCheckoutSession: vi.fn(),
}))

describe('PricingTable', () => {
  it('renders free and pro plans correctly', () => {
    render(<PricingTable />)
    
    expect(screen.getByText('Hobby')).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('$29')).toBeInTheDocument()
  })

  it('toggles yearly pricing', () => {
    render(<PricingTable />)
    
    // Default is monthly ($29)
    expect(screen.getByText('$29')).toBeInTheDocument()
    
    // Click "Yearly" toggle
    const yearlyBtn = screen.getByText(/Yearly/i)
    fireEvent.click(yearlyBtn)
    
    // Should update to yearly price ($290)
    expect(screen.getByText('$290')).toBeInTheDocument()
  })

  it('calls createCheckoutSession when upgrade clicked', async () => {
    const { createCheckoutSession } = await import('@/lib/actions')
    
    render(<PricingTable />)
    
    const upgradeBtn = screen.getByText(/Upgrade to Pro/i)
    fireEvent.click(upgradeBtn)
    
    // Check if mock action was called
    expect(createCheckoutSession).toHaveBeenCalled()
  })
})
