import React, { useEffect, useState, useRef } from 'react'
import {
  X,
  Package,
  Truck,
  MapPin,
  Clock,
  Copy,
  Check,
  Share2,
  Building,
  Mail,
  User,
} from 'lucide-react'
import type { Order } from '../types/order'
import { apiFetchOrderById } from '../api/mockServer'

interface OrderDetailDrawerProps {
  orderId: string | null
  onClose: () => void
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  orderId,
  onClose,
}) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedTracking, setCopiedTracking] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Fetch order details by ID
  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(null)

    const controller = new AbortController()

    apiFetchOrderById(orderId, controller.signal)
      .then((data) => {
        if (!isCancelled) {
          setOrder(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load order details')
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [orderId])

  // Focus close button on open, listen to Escape key
  useEffect(() => {
    if (orderId) {
      setTimeout(() => closeBtnRef.current?.focus(), 100)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && orderId) {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [orderId, onClose])

  if (!orderId) return null

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="false"
    >
      <div
        ref={drawerRef}
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="order-id-badge" style={{ fontSize: '0.95rem' }}>
              {orderId}
            </span>
            {order && (
              <span className={`status-badge ${order.status}`}>
                {order.status.replace('_', ' ')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleShareLink}
              title="Copy deep-link URL"
              aria-label="Share direct deep link URL"
            >
              {copiedLink ? <Check size={14} style={{ color: '#10b981' }} /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              ref={closeBtnRef}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              aria-label="Close order details drawer"
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="skeleton-line" style={{ height: 100, borderRadius: 12 }} />
              <div className="skeleton-line" style={{ height: 160, borderRadius: 12 }} />
              <div className="skeleton-line" style={{ height: 200, borderRadius: 12 }} />
            </div>
          ) : error ? (
            <div className="error-banner">
              <div>
                <p className="error-title">Could not load order</p>
                <p className="error-desc">{error}</p>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Dismiss
              </button>
            </div>
          ) : order ? (
            <>
              {/* Customer Profile Card */}
              <div className="detail-section-card">
                <span className="detail-section-title">
                  <User size={14} /> Customer Profile
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={order.avatar}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: '50%' }}
                  />
                  <div>
                    <h3
                      id="order-drawer-title"
                      style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}
                    >
                      {order.customerName}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Building size={13} />
                      <span>{order.company}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Mail size={13} />
                      <span>{order.customerEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics & Tracking */}
              <div className="detail-section-card">
                <span className="detail-section-title">
                  <Truck size={14} /> Logistics & Fulfillment
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Carrier:</span>
                    <p style={{ fontWeight: 600 }}>{order.carrier}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Priority:</span>
                    <p>
                      <span className={`priority-badge ${order.priority}`}>{order.priority}</span>
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Tracking Number:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
                      <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-accent)' }}>
                        {order.trackingNumber}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(order.trackingNumber)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.15rem 0.35rem' }}
                        aria-label="Copy tracking code"
                        title="Copy tracking code"
                      >
                        {copiedTracking ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Est. Delivery:
                    </span>
                    <p style={{ fontFamily: 'var(--font-mono)' }}>
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="detail-section-card">
                <span className="detail-section-title">
                  <MapPin size={14} /> Shipping Destination
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {order.shippingAddress.street}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                </p>
              </div>

              {/* Progress Timeline */}
              <div className="detail-section-card">
                <span className="detail-section-title">
                  <Clock size={14} /> Fulfillment Timeline
                </span>
                <div className="timeline-list">
                  {order.timeline.map((event, i) => (
                    <div
                      key={i}
                      className={`timeline-step ${event.completed ? 'completed' : ''}`}
                    >
                      <div className="timeline-marker" />
                      <p className="timeline-title">{event.title}</p>
                      <p className="timeline-desc">{event.description}</p>
                      <span className="timeline-time">
                        {new Date(event.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itemized Manifest */}
              <div className="detail-section-card">
                <span className="detail-section-title">
                  <Package size={14} /> Itemized Manifest ({order.items.length} products)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.4rem 0',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.sku} × {item.qty}
                        </span>
                      </div>
                      <span className="amount-text">
                        ${(item.unitPrice * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.5rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>Total Amount</span>
                    <span className="amount-text" style={{ fontSize: '1.1rem', color: '#38bdf8' }}>
                      ${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  )
}
