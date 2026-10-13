import { useState, useEffect, useCallback } from 'react'
import type {
  FilterState,
  OrderStatus,
  OrderPriority,
  OrderRegion,
  OrderChannel,
  SortField,
  SortOrder,
  ViewMode,
} from '../types/order'

export const DEFAULT_FILTER_STATE: FilterState = {
  q: '',
  status: [],
  priority: [],
  region: 'all',
  channel: 'all',
  minAmount: undefined,
  maxAmount: undefined,
  sortField: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 25,
  selectedId: null,
  viewMode: 'paginated',
}

/**
 * Parses URL search string into a validated FilterState object
 */
export function parseUrlToFilters(search: string): FilterState {
  const params = new URLSearchParams(search)

  const q = params.get('q') || ''

  const statusParam = params.get('status')
  const status: OrderStatus[] = statusParam
    ? (statusParam.split(',').filter(Boolean) as OrderStatus[])
    : []

  const priorityParam = params.get('priority')
  const priority: OrderPriority[] = priorityParam
    ? (priorityParam.split(',').filter(Boolean) as OrderPriority[])
    : []

  const region = (params.get('region') as OrderRegion) || 'all'
  const channel = (params.get('channel') as OrderChannel) || 'all'

  const minAmount = params.get('minAmount') ? Number(params.get('minAmount')) : undefined
  const maxAmount = params.get('maxAmount') ? Number(params.get('maxAmount')) : undefined

  const sortField = (params.get('sort') as SortField) || 'createdAt'
  const sortOrder = (params.get('order') as SortOrder) || 'desc'

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
  const pageSize = Math.max(10, parseInt(params.get('pageSize') || '25', 10) || 25)

  const selectedId = params.get('selectedId') || null
  const viewMode = (params.get('viewMode') as ViewMode) || 'paginated'

  return {
    q,
    status,
    priority,
    region,
    channel,
    minAmount: minAmount && !isNaN(minAmount) ? minAmount : undefined,
    maxAmount: maxAmount && !isNaN(maxAmount) ? maxAmount : undefined,
    sortField,
    sortOrder,
    page,
    pageSize,
    selectedId,
    viewMode,
  }
}

/**
 * Serializes FilterState into a clean URL query string, omitting default values
 */
export function serializeFiltersToUrl(state: FilterState): string {
  const params = new URLSearchParams()

  if (state.q && state.q.trim()) {
    params.set('q', state.q.trim())
  }

  if (state.status && state.status.length > 0) {
    params.set('status', state.status.join(','))
  }

  if (state.priority && state.priority.length > 0) {
    params.set('priority', state.priority.join(','))
  }

  if (state.region && state.region !== 'all') {
    params.set('region', state.region)
  }

  if (state.channel && state.channel !== 'all') {
    params.set('channel', state.channel)
  }

  if (state.minAmount !== undefined && state.minAmount > 0) {
    params.set('minAmount', String(state.minAmount))
  }

  if (state.maxAmount !== undefined && state.maxAmount > 0) {
    params.set('maxAmount', String(state.maxAmount))
  }

  if (state.sortField && state.sortField !== 'createdAt') {
    params.set('sort', state.sortField)
  }

  if (state.sortOrder && state.sortOrder !== 'desc') {
    params.set('order', state.sortOrder)
  }

  if (state.page && state.page > 1) {
    params.set('page', String(state.page))
  }

  if (state.pageSize && state.pageSize !== 25) {
    params.set('pageSize', String(state.pageSize))
  }

  if (state.selectedId) {
    params.set('selectedId', state.selectedId)
  }

  if (state.viewMode && state.viewMode !== 'paginated') {
    params.set('viewMode', state.viewMode)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export interface UseUrlStateReturn {
  filters: FilterState
  updateFilters: (
    updater: Partial<FilterState> | ((prev: FilterState) => Partial<FilterState>),
    options?: { replace?: boolean }
  ) => void
  resetFilters: () => void
  openDetail: (id: string) => void
  closeDetail: () => void
}

export function useUrlState(): UseUrlStateReturn {
  const [filters, setFilters] = useState<FilterState>(() =>
    typeof window !== 'undefined'
      ? parseUrlToFilters(window.location.search)
      : DEFAULT_FILTER_STATE
  )

  // Listen to popstate (browser back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlToFilters(window.location.search)
      setFilters(parsed)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Sync state changes to browser URL
  const updateFilters = useCallback(
    (
      updater: Partial<FilterState> | ((prev: FilterState) => Partial<FilterState>),
      options: { replace?: boolean } = {}
    ) => {
      setFilters((prev) => {
        const partial = typeof updater === 'function' ? updater(prev) : updater
        const next: FilterState = { ...prev, ...partial }

        // If search or filter changed, but page wasn't explicitly set, reset to page 1
        const searchChanged = partial.q !== undefined && partial.q !== prev.q
        const filterChanged =
          partial.status !== undefined ||
          partial.priority !== undefined ||
          partial.region !== undefined ||
          partial.channel !== undefined

        if ((searchChanged || filterChanged) && partial.page === undefined) {
          next.page = 1
        }

        const newSearch = serializeFiltersToUrl(next)
        const newUrl = `${window.location.pathname}${newSearch}`

        if (window.location.search !== (newSearch || '')) {
          if (options.replace) {
            window.history.replaceState({ filters: next }, '', newUrl)
          } else {
            window.history.pushState({ filters: next }, '', newUrl)
          }
        }

        return next
      })
    },
    []
  )

  const resetFilters = useCallback(() => {
    updateFilters(
      {
        q: '',
        status: [],
        priority: [],
        region: 'all',
        channel: 'all',
        minAmount: undefined,
        maxAmount: undefined,
        sortField: 'createdAt',
        sortOrder: 'desc',
        page: 1,
      },
      { replace: false }
    )
  }, [updateFilters])

  const openDetail = useCallback(
    (id: string) => {
      updateFilters({ selectedId: id }, { replace: false })
    },
    [updateFilters]
  )

  const closeDetail = useCallback(() => {
    updateFilters({ selectedId: null }, { replace: false })
  }, [updateFilters])

  return {
    filters,
    updateFilters,
    resetFilters,
    openDetail,
    closeDetail,
  }
}
