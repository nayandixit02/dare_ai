import {
  Boxes,
  Activity,
  Sun,
  Moon,
  Flame,
} from 'lucide-react'

interface HeaderProps {
  totalCount: number
  isFetching: boolean
  isDebouncing: boolean
  lastLatencyMs: number | null
  activeChaosCount: number
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onToggleChaos: () => void
  isChaosOpen: boolean
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  isFetching,
  isDebouncing,
  lastLatencyMs,
  theme,
  onToggleTheme,
  onToggleChaos,
  isChaosOpen,
}) => {
  return (
    <header className="app-header" role="banner">
      <div className="brand-wrapper">
        <div className="brand-logo-badge" aria-hidden="true">
          <Boxes size={22} />
        </div>
        <div>
          <h1 className="brand-title">
            Vortex Explorer
            <span className="brand-pill">{totalCount.toLocaleString()} Records</span>
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            High-Performance Virtualized Data Grid • Resilient Real-Time Sync
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Active background fetching indicator */}
        {isFetching && (
          <div
            className="inflight-indicator"
            role="status"
            aria-live="polite"
            title="In-flight request synchronizing with server"
          >
            <div className="pulse-dot" />
            <span>{isDebouncing ? 'Typing...' : 'Syncing server...'}</span>
          </div>
        )}

        {/* Latency badge */}
        {lastLatencyMs !== null && !isFetching && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Last server-side response roundtrip latency"
          >
            <Activity size={13} style={{ color: 'var(--cyan-accent)' }} />
            <span>{lastLatencyMs}ms</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Chaos HUD Button */}
        <button
          type="button"
          className={`btn btn-sm ${isChaosOpen ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onToggleChaos}
          aria-expanded={isChaosOpen}
          aria-label="Open Chaos and Network Inspector panel"
          title="Open Chaos & Network Inspector (Simulate latency & race conditions)"
        >
          <Flame size={15} style={{ color: '#f59e0b' }} />
          <span>Chaos Inspector</span>
        </button>
      </div>
    </header>
  )
}
