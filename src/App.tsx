import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { StatsBanner } from './components/StatsBanner'
import { SearchAndFilterBar } from './components/SearchAndFilterBar'
import { OrdersTable } from './components/OrdersTable'
import { PaginationControls } from './components/PaginationControls'
import { VirtualizedOrdersTable } from './components/VirtualizedOrdersTable'
import { OrderDetailDrawer } from './components/OrderDetailDrawer'
import { ErrorBanner, EmptyState } from './components/HonestStateDisplay'
import { ChaosControlDock } from './components/ChaosControlDock'
import { useUrlState } from './hooks/useUrlState'
import { useOrderExplorer } from './hooks/useOrderExplorer'
import { getChaosConfig } from './api/mockServer'
import { Flame } from 'lucide-react'
import type { SortField } from './types/order'

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isChaosOpen, setIsChaosOpen] = useState(false)
  const chaosConfig = getChaosConfig()

  // 1. URL State Management (Single Source of Truth)
  const { filters, updateFilters, resetFilters, openDetail, closeDetail } = useUrlState()

  // 2. Resilient Data Fetching with Race Condition Prevention & AbortController
  const {
    orders,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    isFetching,
    isDebouncing,
    error,
    lastLatencyMs,
    supersededCount,
    retry,
    simulateRaceCondition,
  } = useOrderExplorer(filters)

  // Sync theme to root DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleSort = (field: SortField) => {
    const isSameField = filters.sortField === field
    const newOrder = isSameField && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    updateFilters({ sortField: field, sortOrder: newOrder, page: 1 }, { replace: false })
  }

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage }, { replace: false })
    // Smooth scroll back to table top
    window.scrollTo({ top: 180, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    updateFilters({ pageSize: newSize, page: 1 }, { replace: false })
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        totalCount={total}
        isFetching={isFetching}
        isDebouncing={isDebouncing}
        lastLatencyMs={lastLatencyMs}
        activeChaosCount={supersededCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleChaos={() => setIsChaosOpen((prev) => !prev)}
        isChaosOpen={isChaosOpen}
      />

      {/* Main Content Area */}
      <main className="main-content" id="main-content" tabIndex={-1}>
        {/* Metric Badges */}
        <StatsBanner
          totalRecords={12500}
          matchedCount={total}
          supersededCount={supersededCount}
          failureRate={chaosConfig.failureRate}
          minLatency={chaosConfig.minLatency}
          maxLatency={chaosConfig.maxLatency}
        />

        {/* Search, Filter & View Mode Controls */}
        <SearchAndFilterBar
          filters={filters}
          onUpdateFilters={updateFilters}
          onResetFilters={resetFilters}
          totalCount={total}
          isDebouncing={isDebouncing}
          isFetching={isFetching}
        />

        {/* Honest State: Error Banner */}
        {error && (
          <ErrorBanner
            error={error}
            onRetry={retry}
            isRetrying={isFetching}
          />
        )}

        {/* Content Display: Paginated Table vs Virtualized Grid */}
        {filters.viewMode === 'paginated' ? (
          <div className="table-card">
            <OrdersTable
              orders={orders}
              isLoading={isLoading}
              isFetching={isFetching}
              sortField={filters.sortField}
              sortOrder={filters.sortOrder}
              selectedId={filters.selectedId}
              onSort={handleSort}
              onSelectOrder={openDetail}
            />

            {!isLoading && !error && orders.length === 0 && (
              <EmptyState query={filters.q} onReset={resetFilters} />
            )}

            {!isLoading && orders.length > 0 && (
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        ) : (
          <VirtualizedOrdersTable
            filters={filters}
            selectedId={filters.selectedId}
            onSort={handleSort}
            onSelectOrder={openDetail}
          />
        )}
      </main>

      {/* Deep-Linked Order Detail Slide-Over Drawer */}
      <OrderDetailDrawer
        orderId={filters.selectedId}
        onClose={closeDetail}
      />

      {/* Floating Chaos Inspector HUD */}
      {!isChaosOpen && (
        <button
          type="button"
          className="chaos-dock-trigger"
          onClick={() => setIsChaosOpen(true)}
          aria-label="Open Chaos and Network Inspector"
          title="Simulate network latency, 10% errors, and race conditions"
        >
          <Flame size={16} />
          <span>Chaos Inspector</span>
          {supersededCount > 0 && (
            <span
              style={{
                background: '#4338ca',
                color: '#ffffff',
                padding: '0.1rem 0.4rem',
                borderRadius: 9999,
                fontSize: '0.7rem',
              }}
            >
              {supersededCount} aborted
            </span>
          )}
        </button>
      )}

      <ChaosControlDock
        isOpen={isChaosOpen}
        onClose={() => setIsChaosOpen(false)}
        onSimulateRace={simulateRaceCondition}
      />
    </div>
  )
}

export default App
