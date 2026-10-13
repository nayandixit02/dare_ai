export type OrderStatus =
  | 'delivered'
  | 'processing'
  | 'in_transit'
  | 'cancelled'
  | 'refunded'
  | 'on_hold'

export type OrderPriority = 'critical' | 'high' | 'medium' | 'low'

export type OrderRegion =
  | 'North America'
  | 'Europe'
  | 'Asia Pacific'
  | 'Latin America'
  | 'Middle East'

export type OrderChannel =
  | 'Direct Web'
  | 'Enterprise Portal'
  | 'API Partner'
  | 'Wholesale'

export type SortField = 'id' | 'customerName' | 'amount' | 'createdAt' | 'status' | 'priority'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'paginated' | 'virtual'

export interface OrderItem {
  name: string
  sku: string
  qty: number
  unitPrice: number
}

export interface TimelineEvent {
  title: string
  timestamp: string
  completed: boolean
  description: string
}

export interface ShippingAddress {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  company: string
  avatar: string
  amount: number
  currency: string
  status: OrderStatus
  priority: OrderPriority
  region: OrderRegion
  channel: OrderChannel
  createdAt: string
  itemsCount: number
  carrier: string
  trackingNumber: string
  estimatedDelivery: string
  shippingAddress: ShippingAddress
  timeline: TimelineEvent[]
  items: OrderItem[]
}

export interface FilterState {
  q: string
  status: OrderStatus[]
  priority: OrderPriority[]
  region: OrderRegion | 'all'
  channel: OrderChannel | 'all'
  minAmount?: number
  maxAmount?: number
  sortField: SortField
  sortOrder: SortOrder
  page: number
  pageSize: number
  selectedId: string | null
  viewMode: ViewMode
}

export interface ApiResponse<T> {
  data: T
  total: number
  page: number
  pageSize: number
  totalPages: number
  latencyMs: number
  requestId: string
  serverTimestamp: number
}

export interface ChaosConfig {
  enabled: boolean
  minLatency: number // ms, default 200
  maxLatency: number // ms, default 3000
  failureRate: number // 0.0 to 1.0, default 0.10 (1 in 10 requests)
  simulatedErrorType: '503_CHAOS' | '500_INTERNAL' | '429_RATE_LIMIT'
}

export interface NetworkLogItem {
  id: string
  seq: number
  url: string
  paramsSummary: string
  startTime: number
  endTime?: number
  durationMs?: number
  status: 'pending' | 'success' | 'failed' | 'aborted'
  httpCode?: number
  errorMessage?: string
}
