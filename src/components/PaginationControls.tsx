import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems === 0) return null

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalItems)

  // Compute page numbers window
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      if (start > 2) {
        pages.push('ellipsis')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis')
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <nav
      className="pagination-bar"
      role="navigation"
      aria-label="Orders table pagination navigation"
    >
      <div className="pagination-info" aria-live="polite">
        Showing <strong>{startRecord.toLocaleString()}</strong>–
        <strong>{endRecord.toLocaleString()}</strong> of{' '}
        <strong>{totalItems.toLocaleString()}</strong> orders
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
          <label htmlFor="page-size-select" style={{ color: 'var(--text-muted)' }}>
            Rows per page:
          </label>
          <select
            id="page-size-select"
            className="filter-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ padding: '0.25rem 0.5rem' }}
            aria-label="Number of rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="pagination-controls" role="group" aria-label="Pagination buttons">
          {/* First Page */}
          <button
            type="button"
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            aria-label="Go to first page"
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Go to previous page"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((item, idx) => {
            if (item === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}
                  aria-hidden="true"
                >
                  …
                </span>
              )
            }

            const isCurrent = item === currentPage
            return (
              <button
                key={item}
                type="button"
                className={`page-btn ${isCurrent ? 'active' : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Go to page ${item}`}
              >
                {item}
              </button>
            )
          })}

          {/* Next Page */}
          <button
            type="button"
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Go to next page"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Go to last page"
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}
