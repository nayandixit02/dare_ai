import type {
  Order,
  ApiResponse,
  ChaosConfig,
  NetworkLogItem,
  SortField,
  SortOrder,
} from '../types/order'
import { getMasterOrders } from './mockData'

// Default assignment requirements: 200ms to 3000ms latency, 10% failure rate (1 in 10)
export const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
  enabled: true,
  minLatency: 200,
  maxLatency: 3000,
  failureRate: 0.10, // 1 in 10 requests
  simulatedErrorType: '503_CHAOS',
}

let activeChaosConfig: ChaosConfig = { ...DEFAULT_CHAOS_CONFIG }

export function getChaosConfig(): ChaosConfig {
  return { ...activeChaosConfig }
}

export function updateChaosConfig(updates: Partial<ChaosConfig>) {
  activeChaosConfig = { ...activeChaosConfig, ...updates }
  emitChaosUpdate()
}

// Event bus for network logs and chaos updates
type NetworkLogListener = (logs: NetworkLogItem[]) => void
type ChaosConfigListener = (config: ChaosConfig) => void

const logListeners = new Set<NetworkLogListener>()
const chaosListeners = new Set<ChaosConfigListener>()
const networkLogs: NetworkLogItem[] = []

export function subscribeNetworkLogs(listener: NetworkLogListener): () => void {
  logListeners.add(listener)
  listener([...networkLogs])
  return () => logListeners.delete(listener)
}

export function subscribeChaosConfig(listener: ChaosConfigListener): () => void {
  chaosListeners.add(listener)
  listener(activeChaosConfig)
  return () => chaosListeners.delete(listener)
}

function emitChaosUpdate() {
  chaosListeners.forEach((l) => l(activeChaosConfig))
}

function addNetworkLog(log: NetworkLogItem) {
  networkLogs.unshift(log)
  if (networkLogs.length > 50) networkLogs.pop() // keep last 50
  logListeners.forEach((l) => l([...networkLogs]))
}

function updateNetworkLog(id: string, updates: Partial<NetworkLogItem>) {
  const index = networkLogs.findIndex((item) => item.id === id)
  if (index !== -1) {
    networkLogs[index] = { ...networkLogs[index], ...updates }
    logListeners.forEach((l) => l([...networkLogs]))
  }
}

export function clearNetworkLogs() {
  networkLogs.length = 0
  logListeners.forEach((l) => l([]))
}

let requestCounter = 0

export interface FetchOrdersParams {
  q?: string
  status?: string[]
  priority?: string[]
  region?: string
  channel?: string
  minAmount?: number
  maxAmount?: number
  sortField?: SortField
  sortOrder?: SortOrder
  page?: number
  pageSize?: number
}

/**
 * Server-side order sorting
 */
function sortOrders(orders: Order[], field: SortField, order: SortOrder): Order[] {
  const multiplier = order === 'asc' ? 1 : -1
  return [...orders].sort((a, b) => {
    switch (field) {
      case 'id':
        return multiplier * a.id.localeCompare(b.id)
      case 'customerName':
        return multiplier * a.customerName.localeCompare(b.customerName)
      case 'amount':
        return multiplier * (a.amount - b.amount)
      case 'createdAt':
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'status':
        return multiplier * a.status.localeCompare(b.status)
      case 'priority': {
        const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 }
        return multiplier * (priorityRank[a.priority] - priorityRank[b.priority])
      }
      default:
        return 0
    }
  })
}

/**
 * Server-side search & filtering
 */
function filterOrders(orders: Order[], params: FetchOrdersParams): Order[] {
  let result = orders

  // 1. Text Search across multiple indexed fields
  if (params.q && params.q.trim().length > 0) {
    const query = params.q.trim().toLowerCase()
    result = result.filter((item) => {
      return (
        item.id.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.customerEmail.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.trackingNumber.toLowerCase().includes(query) ||
        item.carrier.toLowerCase().includes(query)
      )
    })
  }

  // 2. Status filter (multi-select)
  if (params.status && params.status.length > 0) {
    const statusSet = new Set(params.status)
    result = result.filter((item) => statusSet.has(item.status))
  }

  // 3. Priority filter (multi-select)
  if (params.priority && params.priority.length > 0) {
    const prioritySet = new Set(params.priority)
    result = result.filter((item) => prioritySet.has(item.priority))
  }

  // 4. Region filter
  if (params.region && params.region !== 'all') {
    result = result.filter((item) => item.region === params.region)
  }

  // 5. Channel filter
  if (params.channel && params.channel !== 'all') {
    result = result.filter((item) => item.channel === params.channel)
  }

  // 6. Min/Max Amount filter
  if (params.minAmount !== undefined && params.minAmount > 0) {
    result = result.filter((item) => item.amount >= params.minAmount!)
  }
  if (params.maxAmount !== undefined && params.maxAmount > 0) {
    result = result.filter((item) => item.amount <= params.maxAmount!)
  }

  return result
}

/**
 * Mock API fetchOrders with full server-side processing, random latency (200ms - 3s),
 * 10% failure rate, and true AbortSignal cancellation support.
 */
export async function apiFetchOrders(
  params: FetchOrdersParams,
  signal?: AbortSignal,
  customChaos?: Partial<ChaosConfig>
): Promise<ApiResponse<Order[]>> {
  const cfg = { ...activeChaosConfig, ...customChaos }
  const requestId = `REQ-${++requestCounter}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  const startTime = performance.now()

  // Calculate random latency between minLatency and maxLatency
  const latency = cfg.enabled
    ? Math.floor(Math.random() * (cfg.maxLatency - cfg.minLatency + 1)) + cfg.minLatency
    : 0

  const summary = [
    params.q ? `q="${params.q}"` : '',
    params.status?.length ? `status=[${params.status.join(',')}]` : '',
    params.sortField ? `sort=${params.sortField}:${params.sortOrder}` : '',
    `page=${params.page ?? 1}`,
  ]
    .filter(Boolean)
    .join(' ')

  const logEntry: NetworkLogItem = {
    id: requestId,
    seq: requestCounter,
    url: `/api/v1/orders?${new URLSearchParams({
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 25),
      ...(params.q ? { q: params.q } : {}),
    }).toString()}`,
    paramsSummary: summary || 'default',
    startTime: Date.now(),
    status: 'pending',
  }
  addNetworkLog(logEntry)

  // Sleep with AbortSignal cancellation listener
  try {
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new DOMException('Request aborted by client before send', 'AbortError'))
      }

      let timer: ReturnType<typeof setTimeout> | null = null

      const onAbort = () => {
        if (timer) clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        reject(new DOMException('Request aborted by client', 'AbortError'))
      }

      timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, latency)

      signal?.addEventListener('abort', onAbort)
    })
  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime)
    updateNetworkLog(requestId, {
      status: 'aborted',
      endTime: Date.now(),
      durationMs: elapsed,
      errorMessage: 'Cancelled by AbortController (superseded)',
    })
    throw err
  }

  // Check random failure rate (1 in 10 requests default)
  const isFailure = cfg.enabled && Math.random() < cfg.failureRate

  if (isFailure) {
    const elapsed = Math.round(performance.now() - startTime)
    const errorMsg = 'HTTP 503 Service Unavailable: Simulated network chaos / temporary server outage'
    updateNetworkLog(requestId, {
      status: 'failed',
      endTime: Date.now(),
      durationMs: elapsed,
      httpCode: 503,
      errorMessage: errorMsg,
    })
    throw new Error(errorMsg)
  }

  // Execute server-side query processing
  const allOrders = getMasterOrders()
  const filtered = filterOrders(allOrders, params)
  const sorted = sortOrders(
    filtered,
    params.sortField || 'createdAt',
    params.sortOrder || 'desc'
  )

  const page = Math.max(1, params.page || 1)
  const pageSize = Math.max(1, params.pageSize || 25)
  const total = sorted.length
  const totalPages = Math.ceil(total / pageSize) || 1

  const startIndex = (page - 1) * pageSize
  const paginatedItems = sorted.slice(startIndex, startIndex + pageSize)

  const elapsed = Math.round(performance.now() - startTime)
  updateNetworkLog(requestId, {
    status: 'success',
    endTime: Date.now(),
    durationMs: elapsed,
    httpCode: 200,
  })

  return {
    data: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
    latencyMs: elapsed,
    requestId,
    serverTimestamp: Date.now(),
  }
}

/**
 * Fetch a single order by ID for the deep-linked detail drawer
 */
export async function apiFetchOrderById(
  id: string,
  signal?: AbortSignal
): Promise<Order> {
  const startTime = performance.now()
  const requestId = `REQ-DETAIL-${++requestCounter}`

  const latency = Math.floor(Math.random() * 300) + 150 // 150-450ms for detail view
  addNetworkLog({
    id: requestId,
    seq: requestCounter,
    url: `/api/v1/orders/${id}`,
    paramsSummary: `Detail view id=${id}`,
    startTime: Date.now(),
    status: 'pending',
  })

  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Request aborted', 'AbortError'))
    }
    const timer = setTimeout(resolve, latency)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Request aborted', 'AbortError'))
    })
  })

  const allOrders = getMasterOrders()
  const found = allOrders.find((o) => o.id === id)

  const elapsed = Math.round(performance.now() - startTime)
  if (!found) {
    updateNetworkLog(requestId, {
      status: 'failed',
      endTime: Date.now(),
      durationMs: elapsed,
      httpCode: 404,
      errorMessage: `Order ${id} not found`,
    })
    throw new Error(`Order ${id} not found`)
  }

  updateNetworkLog(requestId, {
    status: 'success',
    endTime: Date.now(),
    durationMs: elapsed,
    httpCode: 200,
  })

  return found
}

/**
 * Fetch raw virtual slice (for TanStack Virtual list mode if needed)
 */
export async function apiFetchAllFilteredIds(
  params: Omit<FetchOrdersParams, 'page' | 'pageSize'>,
  signal?: AbortSignal
): Promise<Order[]> {
  if (signal?.aborted) {
    throw new DOMException('Request aborted by client', 'AbortError')
  }
  const allOrders = getMasterOrders()
  const filtered = filterOrders(allOrders, params)
  const sorted = sortOrders(
    filtered,
    params.sortField || 'createdAt',
    params.sortOrder || 'desc'
  )
  return sorted
}
