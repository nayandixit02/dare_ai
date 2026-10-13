import React from 'react'
import {
  Database,
  Filter,
  Zap,
  ShieldAlert,
} from 'lucide-react'

interface StatsBannerProps {
  totalRecords: number
  matchedCount: number
  supersededCount: number
  failureRate: number
  minLatency: number
  maxLatency: number
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  totalRecords,
  matchedCount,
  supersededCount,
  failureRate,
  minLatency,
  maxLatency,
}) => {
  return (
    <section className="stats-banner" aria-label="Explorer Metrics Summary">
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Total Dataset</span>
          <span className="stat-value">{totalRecords.toLocaleString()}</span>
          <span className="stat-subtext">Verified enterprise orders</span>
        </div>
        <div className="stat-icon" aria-hidden="true">
          <Database size={20} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Active Matches</span>
          <span className="stat-value">{matchedCount.toLocaleString()}</span>
          <span className="stat-subtext">Filtered server-side</span>
        </div>
        <div className="stat-icon" aria-hidden="true">
          <Filter size={20} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Superseded Aborts</span>
          <span className="stat-value" style={{ color: '#fbbf24' }}>
            {supersededCount}
          </span>
          <span className="stat-subtext">Stale requests canceled</span>
        </div>
        <div className="stat-icon" aria-hidden="true">
          <Zap size={20} style={{ color: '#fbbf24' }} />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Network Chaos</span>
          <span className="stat-value" style={{ color: '#f43f5e' }}>
            {Math.round(failureRate * 100)}% Err
          </span>
          <span className="stat-subtext">
            {minLatency}ms–{maxLatency}ms latency
          </span>
        </div>
        <div className="stat-icon" aria-hidden="true">
          <ShieldAlert size={20} style={{ color: '#f43f5e' }} />
        </div>
      </div>
    </section>
  )
}
