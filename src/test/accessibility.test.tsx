import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrdersTable } from '../components/OrdersTable'
import { OrderDetailDrawer } from '../components/OrderDetailDrawer'
import type { Order } from '../types/order'

const sampleOrders: Order[] = [
  {
    id: 'ORD-10001',
    customerName: 'Alice Vance',
    customerEmail: 'alice@vanguard.com',
    company: 'Vanguard Logistics',
    avatar: 'https://example.com/avatar1.png',
    amount: 1450.5,
    currency: 'USD',
    status: 'delivered',
    priority: 'high',
    region: 'North America',
    channel: 'Direct Web',
    createdAt: '2026-03-01T12:00:00.000Z',
    itemsCount: 3,
    carrier: 'FedEx Priority',
    trackingNumber: 'TRK-NA-102938',
    estimatedDelivery: '2026-03-05T12:00:00.000Z',
    shippingAddress: {
      street: '123 Tech Way',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      postalCode: '78701',
    },
    timeline: [
      {
        title: 'Order Placed',
        timestamp: '2026-03-01T12:00:00.000Z',
        completed: true,
        description: 'Verified',
      },
    ],
    items: [
      {
        name: 'Quantum Core Accelerator',
        sku: 'SKU-QC-09',
        qty: 1,
        unitPrice: 1450.5,
      },
    ],
  },
]

describe('Accessibility & UI Interactions', () => {
  it('renders table with proper accessible grid semantics and headers', () => {
    const handleSort = vi.fn()
    const handleSelect = vi.fn()

    render(
      <OrdersTable
        orders={sampleOrders}
        isLoading={false}
        isFetching={false}
        sortField="createdAt"
        sortOrder="desc"
        selectedId={null}
        onSort={handleSort}
        onSelectOrder={handleSelect}
      />
    )

    const table = screen.getByRole('grid', { name: /Enterprise Logistics Orders/i })
    expect(table).toBeInTheDocument()

    // Verify sortable header has aria-sort attribute
    const idHeader = screen.getByRole('columnheader', { name: /Order ID/i })
    expect(idHeader).toBeInTheDocument()
    expect(idHeader).toHaveAttribute('aria-sort', 'none')

    const dateHeader = screen.getByRole('columnheader', { name: /Created Date/i })
    expect(dateHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('triggers onSelectOrder when row is clicked or Enter key is pressed', () => {
    const handleSort = vi.fn()
    const handleSelect = vi.fn()

    render(
      <OrdersTable
        orders={sampleOrders}
        isLoading={false}
        isFetching={false}
        sortField="createdAt"
        sortOrder="desc"
        selectedId={null}
        onSort={handleSort}
        onSelectOrder={handleSelect}
      />
    )

    const row = screen.getByText('Alice Vance').closest('tr')!
    expect(row).toBeInTheDocument()

    // Test click
    fireEvent.click(row)
    expect(handleSelect).toHaveBeenCalledWith('ORD-10001')

    // Test keyboard Enter
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' })
    expect(handleSelect).toHaveBeenCalledWith('ORD-10001')
  })

  it('renders OrderDetailDrawer with dialog role and aria-modal', () => {
    const handleClose = vi.fn()

    render(
      <OrderDetailDrawer
        orderId="ORD-10001"
        onClose={handleClose}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
