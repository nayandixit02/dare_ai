import React from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Truck,
  Package,
} from 'lucide-react'
import type {
  Order,
  SortField,
  SortOrder,
  OrderStatus,
} from '../types/order'

interface OrdersTableProps {
  orders: Order[]
  isLoading: boolean
  isFetching: boolean
  sortField: SortField
  sortOrder: SortOrder
  selectedId: string | null
  onSort: (field: SortField) => void
  onSelectOrder: (id: string) => void
}

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  delivered: <CheckCircle2 size={13} />,
  processing: <Clock size={13} />,
  in_transit: <Truck size={13} />,
  cancelled: <AlertTriangle size={13} />,
  refunded: <RotateCcw size={13} />,
  on_hold: <Package size={13} />,
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  isLoading,
  sortField,
  sortOrder,
  selectedId,
  onSort,
  onSelectOrder,
}) => {
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4 }} aria-hidden="true" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} style={{ color: 'var(--primary)' }} aria-hidden="true" />
    ) : (
      <ArrowDown size={13} style={{ color: 'var(--primary)' }} aria-hidden="true" />
    )
  }

  const getAriaSort = (field: SortField): 'ascending' | 'descending' | 'none' => {
    if (sortField !== field) return 'none'
    return sortOrder === 'asc' ? 'ascending' : 'descending'
  }

  const handleRowKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectOrder(id)
    }
  }

  return (
    <div className="table-responsive">
      <table
        className="orders-table"
        role="grid"
        aria-label="Enterprise Logistics Orders"
        aria-rowcount={orders.length}
      >
        <thead>
          <tr role="row">
            <th
              scope="col"
              className="sortable-th"
              aria-sort={getAriaSort('id')}
              onClick={() => onSort('id')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSort('id')
                }
              }}
            >
              <div className="th-content">
                <span>Order ID</span>
                {renderSortIcon('id')}
              </div>
            </th>

            <th
              scope="col"
              className="sortable-th"
              aria-sort={getAriaSort('customerName')}
              onClick={() => onSort('customerName')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSort('customerName')
                }
              }}
            >
              <div className="th-content">
                <span>Customer & Company</span>
                {renderSortIcon('customerName')}
              </div>
            </th>

            <th
              scope="col"
              className="sortable-th"
              aria-sort={getAriaSort('status')}
              onClick={() => onSort('status')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSort('status')
                }
              }}
            >
              <div className="th-content">
                <span>Status</span>
                {renderSortIcon('status')}
              </div>
            </th>

            <th
              scope="col"
              className="sortable-th"
              aria-sort={getAriaSort('priority')}
              onClick={() => onSort('priority')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSort('priority')
                }
              }}
            >
              <div className="th-content">
                <span>Priority</span>
                {renderSortIcon('priority')}
              </div>
            </th>

            <th
              scope="col"
              className="sortable-th"
              aria-sort={getAriaSort('amount')}
              onClick={() => onSort('amount')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSort('amount')
                }
              }}
            >
              <div className="th-content">
                <span>Amount</span>
                {renderSortIcon('amount')}
              </div>
            </th>

            <th scope="col">Region</th>

            <th
              scope="col"
              className="sortable-th"
              aria-sort={getAriaSort('createdAt')}
              onClick={() => onSort('createdAt')}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSort('createdAt')
                }
              }}
            >
              <div className="th-content">
                <span>Created Date</span>
                {renderSortIcon('createdAt')}
              </div>
            </th>

            <th scope="col" aria-label="Actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            // Skeleton loader rows
            Array.from({ length: 8 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} aria-hidden="true">
                <td><div className="skeleton-line" style={{ width: 85 }} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="skeleton-line" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="skeleton-line" style={{ width: 120, height: 14 }} />
                      <div className="skeleton-line" style={{ width: 80, height: 10 }} />
                    </div>
                  </div>
                </td>
                <td><div className="skeleton-line" style={{ width: 90, height: 22, borderRadius: 9999 }} /></td>
                <td><div className="skeleton-line" style={{ width: 60, height: 18 }} /></td>
                <td><div className="skeleton-line" style={{ width: 75 }} /></td>
                <td><div className="skeleton-line" style={{ width: 100 }} /></td>
                <td><div className="skeleton-line" style={{ width: 95 }} /></td>
                <td><div className="skeleton-line" style={{ width: 24, height: 24 }} /></td>
              </tr>
            ))
          ) : (
            orders.map((order, index) => {
              const isSelected = selectedId === order.id
              return (
                <tr
                  key={order.id}
                  role="row"
                  aria-rowindex={index + 1}
                  aria-selected={isSelected}
                  className={isSelected ? 'row-selected' : ''}
                  onClick={() => onSelectOrder(order.id)}
                  tabIndex={0}
                  onKeyDown={(e) => handleRowKeyDown(e, order.id)}
                  title={`View details for ${order.id}`}
                >
                  <td>
                    <span className="order-id-badge">{order.id}</span>
                  </td>

                  <td>
                    <div className="customer-cell">
                      <img
                        src={order.avatar}
                        alt=""
                        className="customer-avatar"
                        aria-hidden="true"
                        loading="lazy"
                      />
                      <div className="customer-meta">
                        <span className="customer-name">{order.customerName}</span>
                        <span className="customer-company">{order.company}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {STATUS_ICONS[order.status]}
                      <span>{order.status.replace('_', ' ')}</span>
                    </span>
                  </td>

                  <td>
                    <span className={`priority-badge ${order.priority}`}>
                      {order.priority}
                    </span>
                  </td>

                  <td>
                    <span className="amount-text">
                      ${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {order.region}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectOrder(order.id)
                      }}
                      aria-label={`Open order details for ${order.id}`}
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
