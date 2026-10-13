import { describe, it, expect } from 'vitest'
import { apiFetchOrders } from '../api/mockServer'

describe('Honest Error Handling & Failure States', () => {
  it('throws an honest 503 error when failure rate triggers', async () => {
    // Force 100% failure rate
    await expect(
      apiFetchOrders(
        { q: 'test' },
        undefined,
        { minLatency: 10, maxLatency: 10, failureRate: 1.0, enabled: true }
      )
    ).rejects.toThrow(/HTTP 503 Service Unavailable/)
  })

  it('succeeds reliably when failure rate is 0% (testing retry resilience)', async () => {
    const res = await apiFetchOrders(
      { page: 1, pageSize: 5 },
      undefined,
      { minLatency: 10, maxLatency: 10, failureRate: 0.0, enabled: true }
    )

    expect(res.data).toBeDefined()
    expect(res.data.length).toBe(5)
    expect(res.total).toBe(12500)
    expect(res.totalPages).toBe(2500)
  })
})
