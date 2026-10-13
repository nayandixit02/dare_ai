import React, { useRef, useEffect } from 'react'
import {
  Search,
  X,
  RotateCcw,
  LayoutList,
  Rows,
} from 'lucide-react'
import type {
  FilterState,
  OrderStatus,
  OrderPriority,
  OrderRegion,
  OrderChannel,
  ViewMode,
} from '../types/order'

interface SearchAndFilterBarProps {
  filters: FilterState
  onUpdateFilters: (
    updater: Partial<FilterState> | ((prev: FilterState) => Partial<FilterState>),
    options?: { replace?: boolean }
  ) => void
  onResetFilters: () => void
  totalCount: number
  isDebouncing: boolean
  isFetching: boolean
}

const ALL_STATUSES: { key: OrderStatus; label: string }[] = [
  { key: 'delivered', label: 'Delivered' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'processing', label: 'Processing' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
]

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  totalCount,
  isDebouncing,
  isFetching,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Pressing "/" focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Using replace: true prevents history stack spam during rapid typing
    onUpdateFilters({ q: val }, { replace: true })
  }

  const handleClearSearch = () => {
    onUpdateFilters({ q: '' }, { replace: false })
    searchInputRef.current?.focus()
  }

  const toggleStatus = (statusKey: OrderStatus) => {
    const current = filters.status || []
    const next = current.includes(statusKey)
      ? current.filter((s) => s !== statusKey)
      : [...current, statusKey]

    onUpdateFilters({ status: next }, { replace: false })
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const priority = val === 'all' ? [] : [val as OrderPriority]
    onUpdateFilters({ priority }, { replace: false })
  }

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateFilters({ region: e.target.value as OrderRegion | 'all' }, { replace: false })
  }

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateFilters({ channel: e.target.value as OrderChannel | 'all' }, { replace: false })
  }

  const handleViewModeToggle = (mode: ViewMode) => {
    onUpdateFilters({ viewMode: mode }, { replace: false })
  }

  const hasActiveFilters =
    Boolean(filters.q) ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.region !== 'all' ||
    filters.channel !== 'all'

  return (
    <div className="filter-card" role="search" aria-label="Order filters and search">
      {/* Search Input Row */}
      <div className="search-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            id="order-search-input"
            type="text"
            className="search-input"
            placeholder="Search 12,500 records by order ID, customer, company, tracking..."
            value={filters.q}
            onChange={handleSearchChange}
            aria-label="Search orders"
            aria-describedby="search-instructions"
            autoComplete="off"
          />
          {filters.q ? (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search query"
              title="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="kbd-shortcut" aria-hidden="true">
              /
            </kbd>
          )}
        </div>

        {/* View Mode Segmented Switch */}
        <div
          className="view-mode-toggle"
          role="radiogroup"
          aria-label="Table view display mode"
        >
          <button
            type="button"
            role="radio"
            aria-checked={filters.viewMode === 'paginated'}
            className={`view-mode-btn ${filters.viewMode === 'paginated' ? 'active' : ''}`}
            onClick={() => handleViewModeToggle('paginated')}
            title="Paginated Table View"
          >
            <LayoutList size={15} />
            <span>Paginated</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={filters.viewMode === 'virtual'}
            className={`view-mode-btn ${filters.viewMode === 'virtual' ? 'active' : ''}`}
            onClick={() => handleViewModeToggle('virtual')}
            title="Virtualized 60 FPS Scrolling (TanStack Virtual)"
          >
            <Rows size={15} />
            <span>Virtualized (10k)</span>
          </button>
        </div>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetFilters}
            aria-label="Reset all search filters"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Screen reader helper instructions */}
      <span id="search-instructions" className="sr-only">
        Type to search across orders. Results update dynamically and filter server-side.
      </span>

      {/* Secondary Filter Controls Row */}
      <div className="filter-controls-row">
        {/* Status Multi-select Chips */}
        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <div className="status-pills-list" role="group" aria-label="Filter by order status">
            {ALL_STATUSES.map(({ key, label }) => {
              const isActive = filters.status.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isActive}
                  className={`status-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => toggleStatus(key)}
                >
                  <span
                    className={`status-dot ${key}`}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#ffffff' : 'currentColor',
                      display: 'inline-block',
                    }}
                  />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="filter-group">
          {/* Priority */}
          <label htmlFor="priority-filter" className="sr-only">
            Filter by Priority
          </label>
          <select
            id="priority-filter"
            className="filter-select"
            value={filters.priority[0] || 'all'}
            onChange={handlePriorityChange}
            aria-label="Filter by Priority"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Region */}
          <label htmlFor="region-filter" className="sr-only">
            Filter by Region
          </label>
          <select
            id="region-filter"
            className="filter-select"
            value={filters.region}
            onChange={handleRegionChange}
            aria-label="Filter by Region"
          >
            <option value="all">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia Pacific">Asia Pacific</option>
            <option value="Latin America">Latin America</option>
            <option value="Middle East">Middle East</option>
          </select>

          {/* Channel */}
          <label htmlFor="channel-filter" className="sr-only">
            Filter by Channel
          </label>
          <select
            id="channel-filter"
            className="filter-select"
            value={filters.channel}
            onChange={handleChannelChange}
            aria-label="Filter by Channel"
          >
            <option value="all">All Channels</option>
            <option value="Direct Web">Direct Web</option>
            <option value="Enterprise Portal">Enterprise Portal</option>
            <option value="API Partner">API Partner</option>
            <option value="Wholesale">Wholesale</option>
          </select>
        </div>
      </div>

      {/* Screen Reader ARIA Live Region */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isFetching
          ? isDebouncing
            ? 'Typing search query...'
            : 'Loading updated results from server...'
          : `Showing ${totalCount.toLocaleString()} orders matching current criteria.`}
      </div>
    </div>
  )
}
