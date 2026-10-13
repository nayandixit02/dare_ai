import { useState, useEffect, useRef, useCallback } from 'react'
import type { Order, FilterState, ApiResponse } from '../types/order'
import { apiFetchOrders } from '../api/mockServer'

export interface UseOrderExplorerReturn {
  orders: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean // background refresh
  isDebouncing: boolean
  error: Error | null
  lastLatencyMs: number | null
  activeRequestId: string | null
  supersededCount: number
  retry: () => void
  simulateRaceCondition: () => Promise<void>
}

export function useOrderExplorer(filters: FilterState): UseOrderExplorerReturn {
  const [data, setData] = useState<ApiResponse<Order[]> | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [supersededCount, setSupersededCount] = useState<number>(0)

  // Monotonic sequence counter to guarantee request ordering
  const sequenceRef = useRef<number>(0)
  // Active AbortController reference
  const abortControllerRef = useRef<AbortController | null>(null)
  // Debounce timer reference
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stored debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState<string>(filters.q)

  // 1. Handle search query debouncing (300ms)
  useEffect(() => {
    if (filters.q === debouncedQuery) {
      setIsDebouncing(false)
      return
    }

    setIsDebouncing(true)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(filters.q)
      setIsDebouncing(false)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [filters.q, debouncedQuery])

  // 2. Fetch function with AbortController cancellation and monotonic sequencing
  const executeFetch = useCallback(
    async (overrideParams?: Partial<FilterState>) => {
      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        setSupersededCount((c) => c + 1)
      }

      // Create new AbortController for this request
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Increment sequence counter
      const currentSeq = ++sequenceRef.current

      // Set honest loading states
      setIsFetching(true)
      if (!data) {
        setIsLoading(true)
      }
      setError(null)

      const activeParams = {
        q: debouncedQuery,
        status: filters.status,
        priority: filters.priority,
        region: filters.region,
        channel: filters.channel,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        sortField: filters.sortField,
        sortOrder: filters.sortOrder,
        page: filters.page,
        pageSize: filters.pageSize,
        ...overrideParams,
      }

      try {
        const response = await apiFetchOrders(activeParams, controller.signal)

        // Strict guard: if a newer request was dispatched while this was resolving, ignore this response!
        if (currentSeq !== sequenceRef.current) {
          console.warn(`[Race Prevention] Dropped response from sequence #${currentSeq} because #${sequenceRef.current} is newer.`)
          return
        }

        // Fresh response arrived: update state
        setData(response)
        setError(null)
      } catch (err: unknown) {
        // Ignore aborted requests (they were intentionally superseded)
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }

        // If newer request is already active, ignore error
        if (currentSeq !== sequenceRef.current) {
          return
        }

        // Honest Error State:
        // When a request fails, record the error and mark data as needing retry.
        // We do NOT pretend stale data is current!
        const finalError = err instanceof Error ? err : new Error(String(err))
        setError(finalError)
      } finally {
        if (currentSeq === sequenceRef.current) {
          setIsLoading(false)
          setIsFetching(false)
        }
      }
    },
    [
      debouncedQuery,
      filters.status,
      filters.priority,
      filters.region,
      filters.channel,
      filters.minAmount,
      filters.maxAmount,
      filters.sortField,
      filters.sortOrder,
      filters.page,
      filters.pageSize,
      data,
    ]
  )

  // 3. Trigger fetch whenever debouncedQuery or other filters change
  useEffect(() => {
    executeFetch()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [
    debouncedQuery,
    filters.status,
    filters.priority,
    filters.region,
    filters.channel,
    filters.minAmount,
    filters.maxAmount,
    filters.sortField,
    filters.sortOrder,
    filters.page,
    filters.pageSize,
  ])

  // Explicit retry handler
  const retry = useCallback(() => {
    executeFetch()
  }, [executeFetch])

  // 4. Test button: Intentionally trigger rapid race condition with inverted latencies
  // Request 1: takes 2800ms (Query: "test-race-slow")
  // Request 2: takes 1400ms (Query: "test-race-medium")
  // Request 3: takes 200ms  (Query: "test-race-fast")
  // Proves that Request 3 arrives first and supersedes Request 1 and 2!
  const simulateRaceCondition = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const c1 = new AbortController()
    abortControllerRef.current = c1
    const seq1 = ++sequenceRef.current
    setIsFetching(true)

    // Fire Request 1 (slow)
    apiFetchOrders({ q: 'race-slow' }, c1.signal, { minLatency: 2800, maxLatency: 2800 })
      .then((res) => {
        if (seq1 === sequenceRef.current) setData(res)
      })
      .catch(() => {})

    // Wait 50ms, fire Request 2 (medium)
    await new Promise((r) => setTimeout(r, 50))
    c1.abort() // abort previous
    setSupersededCount((c) => c + 1)

    const c2 = new AbortController()
    abortControllerRef.current = c2
    const seq2 = ++sequenceRef.current

    apiFetchOrders({ q: 'race-medium' }, c2.signal, { minLatency: 1400, maxLatency: 1400 })
      .then((res) => {
        if (seq2 === sequenceRef.current) setData(res)
      })
      .catch(() => {})

    // Wait 50ms, fire Request 3 (fast)
    await new Promise((r) => setTimeout(r, 50))
    c2.abort() // abort previous
    setSupersededCount((c) => c + 1)

    const c3 = new AbortController()
    abortControllerRef.current = c3
    const seq3 = ++sequenceRef.current

    try {
      const res3 = await apiFetchOrders({ q: 'race-fast' }, c3.signal, { minLatency: 200, maxLatency: 200 })
      if (seq3 === sequenceRef.current) {
        setData(res3)
        setError(null)
      }
    } catch {
      // handled
    } finally {
      if (seq3 === sequenceRef.current) {
        setIsLoading(false)
        setIsFetching(false)
      }
    }
  }, [])

  return {
    orders: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? filters.page,
    pageSize: data?.pageSize ?? filters.pageSize,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isFetching,
    isDebouncing,
    error,
    lastLatencyMs: data?.latencyMs ?? null,
    activeRequestId: data?.requestId ?? null,
    supersededCount,
    retry,
    simulateRaceCondition,
  }
}
