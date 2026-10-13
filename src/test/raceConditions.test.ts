import { describe, it, expect } from 'vitest'
import { apiFetchOrders } from '../api/mockServer'

describe('Race Condition & Stale State Prevention', () => {
  it('aborts previous in-flight request when AbortSignal triggers', async () => {
    const controller = new AbortController()

    // Dispatch request with 1000ms latency
    const fetchPromise = apiFetchOrders(
      { q: 'test-cancellation' },
      controller.signal,
      { minLatency: 1000, maxLatency: 1000, failureRate: 0 }
    )

    // Abort after 50ms
    setTimeout(() => {
      controller.abort()
    }, 50)

    await expect(fetchPromise).rejects.toThrow()
  })

  it('guarantees newer request response supersedes slower earlier response', async () => {
    let activeState = 'initial'

    // Simulate two sequential queries where Request 1 takes 300ms and Request 2 takes 50ms
    const c1 = new AbortController()
    let seq = 0

    const seq1 = ++seq
    const req1 = apiFetchOrders(
      { q: 'query-1-slow' },
      c1.signal,
      { minLatency: 300, maxLatency: 300, failureRate: 0 }
    ).then((res) => {
      if (seq === seq1) {
        activeState = 'request-1-data'
      }
      return res
    }).catch(() => null)

    // Dispatch Request 2 quickly, superseding Request 1
    c1.abort()
    const c2 = new AbortController()
    const seq2 = ++seq

    const req2 = apiFetchOrders(
      { q: 'query-2-fast' },
      c2.signal,
      { minLatency: 50, maxLatency: 50, failureRate: 0 }
    ).then((res) => {
      if (seq === seq2) {
        activeState = 'request-2-data'
      }
      return res
    })

    await Promise.all([req1, req2])

    // Verify activeState is Request 2's data and was never clobbered by Request 1
    expect(activeState).toBe('request-2-data')
    expect(c1.signal.aborted).toBe(true)
    expect(c2.signal.aborted).toBe(false)
  })

  it('correctly filters orders server-side without data corruption', async () => {
    const res = await apiFetchOrders(
      { status: ['delivered'], pageSize: 10 },
      undefined,
      { minLatency: 0, maxLatency: 0, failureRate: 0 }
    )

    expect(res.data.length).toBeGreaterThan(0)
    res.data.forEach((order) => {
      expect(order.status).toBe('delivered')
    })
  })
})
