import React, { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ExternalLink,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import type { Order, SortField, FilterState } from '../types/order'
import { apiFetchAllFilteredIds } from '../api/mockServer'

interface VirtualizedOrdersTableProps {
  filters: FilterState
  selectedId: string | null
  onSort: (field: SortField) => void
  onSelectOrder: (id: string) => void
}

export const VirtualizedOrdersTable: React.FC<VirtualizedOrdersTableProps> = ({
  filters,
  selectedId,
  onSort,
  onSelectOrder,
}) => {
  const [allFilteredOrders, setAllFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const parentRef = useRef<HTMLDivElement>(null)

  // Fetch full filtered dataset for virtual scrolling
  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    apiFetchAllFilteredIds({
      q: filters.q,
      status: filters.status,
      priority: filters.priority,
      region: filters.region,
      channel: filters.channel,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      sortField: filters.sortField,
      sortOrder: filters.sortOrder,
    }).then((items) => {
      if (!isCancelled) {
        setAllFilteredOrders(items)
        setLoading(false)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [
    filters.q,
    filters.status,
    filters.priority,
    filters.region,
    filters.channel,
    filters.minAmount,
    filters.maxAmount,
    filters.sortField,
    filters.sortOrder,
  ])

  const rowVirtualizer = useVirtualizer({
    count: allFilteredOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // 52px height per row
    overscan: 6,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  const renderSortIcon = (field: SortField) => {
    if (filters.sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.4 }} aria-hidden="true" />
    }
    return filters.sortOrder === 'asc' ? (
      <ArrowUp size={12} style={{ color: 'var(--primary)' }} aria-hidden="true" />
    ) : (
      <ArrowDown size={12} style={{ color: 'var(--primary)' }} aria-hidden="true" />
    )
  }

  return (
    <div className="table-card">
      {/* Virtualization banner */}
      <div
        style={{
          padding: '0.65rem 1.25rem',
          background: 'rgba(99, 102, 241, 0.08)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: '#a5b4fc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={14} style={{ color: '#818cf8' }} />
          <span>
            <strong>TanStack Virtualizer Active:</strong> Rendering only{' '}
            <strong>{virtualItems.length}</strong> DOM nodes out of{' '}
            <strong>{allFilteredOrders.length.toLocaleString()}</strong> items
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Buttery 60 FPS viewport scrolling
        </span>
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 2.2fr 130px 110px 130px 130px 130px 60px',
          padding: '0.75rem 1.25rem',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <div
          onClick={() => onSort('id')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>ID</span>
          {renderSortIcon('id')}
        </div>
        <div
          onClick={() => onSort('customerName')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>Customer & Company</span>
          {renderSortIcon('customerName')}
        </div>
        <div
          onClick={() => onSort('status')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>Status</span>
          {renderSortIcon('status')}
        </div>
        <div
          onClick={() => onSort('priority')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>Priority</span>
          {renderSortIcon('priority')}
        </div>
        <div
          onClick={() => onSort('amount')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>Amount</span>
          {renderSortIcon('amount')}
        </div>
        <div>Region</div>
        <div
          onClick={() => onSort('createdAt')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span>Created</span>
          {renderSortIcon('createdAt')}
        </div>
        <div>Actions</div>
      </div>

      {/* Virtual Scroll Area */}
      <div
        ref={parentRef}
        className="virtual-table-container"
        tabIndex={0}
        aria-label="Virtualized orders list"
        role="region"
      >
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading {allFilteredOrders.length.toLocaleString() || 'large dataset'} into virtual viewport...
          </div>
        ) : allFilteredOrders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No records match the current filters.
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const order = allFilteredOrders[virtualRow.index]
              if (!order) return null
              const isSelected = selectedId === order.id

              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectOrder(order.id)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: '120px 2.2fr 130px 110px 130px 130px 130px 60px',
                    alignItems: 'center',
                    padding: '0 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                  }}
                  className="orders-table-row"
                >
                  <div>
                    <span className="order-id-badge">{order.id}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                    <img
                      src={order.avatar}
                      alt=""
                      className="customer-avatar"
                      style={{ width: 26, height: 26 }}
                      loading="lazy"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {order.customerName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {order.company}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`status-badge ${order.status}`}>
                      <span>{order.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <div>
                    <span className={`priority-badge ${order.priority}`}>{order.priority}</span>
                  </div>

                  <div>
                    <span className="amount-text">
                      ${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {order.region}
                  </div>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>

                  <div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectOrder(order.id)
                      }}
                      style={{ padding: '0.2rem 0.4rem' }}
                      aria-label={`Open details for ${order.id}`}
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
