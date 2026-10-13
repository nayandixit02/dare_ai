import { describe, it, expect } from 'vitest'
import { parseUrlToFilters, serializeFiltersToUrl, DEFAULT_FILTER_STATE } from '../hooks/useUrlState'
import type { FilterState } from '../types/order'

describe('URL State Serialization & Deserialization', () => {
  it('parses empty query string to default filter state', () => {
    const filters = parseUrlToFilters('')
    expect(filters.q).toBe('')
    expect(filters.status).toEqual([])
    expect(filters.priority).toEqual([])
    expect(filters.region).toBe('all')
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(25)
    expect(filters.selectedId).toBeNull()
  })

  it('correctly deserializes full query parameters', () => {
    const search = '?q=Vanguard&status=delivered,in_transit&priority=critical&region=Europe&sort=amount&order=asc&page=4&pageSize=50&selectedId=ORD-10420&viewMode=virtual'
    const filters = parseUrlToFilters(search)

    expect(filters.q).toBe('Vanguard')
    expect(filters.status).toEqual(['delivered', 'in_transit'])
    expect(filters.priority).toEqual(['critical'])
    expect(filters.region).toBe('Europe')
    expect(filters.sortField).toBe('amount')
    expect(filters.sortOrder).toBe('asc')
    expect(filters.page).toBe(4)
    expect(filters.pageSize).toBe(50)
    expect(filters.selectedId).toBe('ORD-10420')
    expect(filters.viewMode).toBe('virtual')
  })

  it('serializes filter state to URL omitting default parameters', () => {
    const state: FilterState = {
      ...DEFAULT_FILTER_STATE,
      q: 'Acme',
      status: ['delivered'],
      page: 2,
    }

    const url = serializeFiltersToUrl(state)
    expect(url).toContain('q=Acme')
    expect(url).toContain('status=delivered')
    expect(url).toContain('page=2')
    // Should omit default sort order and sortField
    expect(url).not.toContain('sort=createdAt')
    expect(url).not.toContain('order=desc')
  })

  it('preserves deep-linked selectedId in serialized URL', () => {
    const state: FilterState = {
      ...DEFAULT_FILTER_STATE,
      selectedId: 'ORD-10999',
    }

    const url = serializeFiltersToUrl(state)
    expect(url).toBe('?selectedId=ORD-10999')
  })
})
