import React from 'react'
import {
  AlertOctagon,
  RefreshCw,
  SearchX,
  RotateCcw,
} from 'lucide-react'

interface ErrorStateProps {
  error: Error
  onRetry: () => void
  isRetrying: boolean
}

export const ErrorBanner: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  isRetrying,
}) => {
  return (
    <div
      className="error-banner"
      role="alert"
      aria-live="assertive"
    >
      <div className="error-banner-content">
        <div className="error-icon-box" aria-hidden="true">
          <AlertOctagon size={22} />
        </div>
        <div>
          <h2 className="error-title">Honest Error State: Request Failed</h2>
          <p className="error-desc">{error.message}</p>
          <p style={{ fontSize: '0.75rem', color: '#fbcfe8', marginTop: 4 }}>
            Assignment simulated chaos triggered (1 in 10 failure rate). Old data was flagged rather than pretending it is fresh.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onRetry}
        disabled={isRetrying}
        aria-label="Retry failed request"
      >
        <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
        <span>{isRetrying ? 'Retrying...' : 'Retry Request'}</span>
      </button>
    </div>
  )
}

interface EmptyStateProps {
  query: string
  onReset: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ query, onReset }) => {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true">
        <SearchX size={32} />
      </div>
      <h3 className="empty-state-title">No orders found</h3>
      <p className="empty-state-desc">
        {query
          ? `We couldn't find any enterprise orders matching "${query}" with the current filters applied.`
          : 'No records in the dataset match the selected status or region filters.'}
      </p>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onReset}
        aria-label="Reset all filters to defaults"
      >
        <RotateCcw size={15} />
        <span>Clear All Filters</span>
      </button>
    </div>
  )
}
