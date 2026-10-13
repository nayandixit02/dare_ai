import React, { useState, useEffect } from 'react'
import {
  Flame,
  X,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Activity,
} from 'lucide-react'
import type { ChaosConfig, NetworkLogItem } from '../types/order'
import {
  getChaosConfig,
  updateChaosConfig,
  subscribeNetworkLogs,
  subscribeChaosConfig,
  clearNetworkLogs,
} from '../api/mockServer'

interface ChaosControlDockProps {
  isOpen: boolean
  onClose: () => void
  onSimulateRace: () => Promise<void>
}

export const ChaosControlDock: React.FC<ChaosControlDockProps> = ({
  isOpen,
  onClose,
  onSimulateRace,
}) => {
  const [config, setConfig] = useState<ChaosConfig>(getChaosConfig())
  const [logs, setLogs] = useState<NetworkLogItem[]>([])
  const [isSimulatingRace, setIsSimulatingRace] = useState(false)

  useEffect(() => {
    const unsubLogs = subscribeNetworkLogs((newLogs) => setLogs(newLogs))
    const unsubChaos = subscribeChaosConfig((newCfg) => setConfig(newCfg))
    return () => {
      unsubLogs()
      unsubChaos()
    }
  }, [])

  if (!isOpen) return null

  const handleLatencyPreset = (min: number, max: number) => {
    updateChaosConfig({ minLatency: min, maxLatency: max })
  }

  const handleFailureRateChange = (rate: number) => {
    updateChaosConfig({ failureRate: rate })
  }

  const handleTriggerRace = async () => {
    setIsSimulatingRace(true)
    try {
      await onSimulateRace()
    } finally {
      setIsSimulatingRace(false)
    }
  }

  return (
    <div
      className="chaos-dock-panel"
      role="complementary"
      aria-label="Chaos and Network Inspector"
    >
      <div className="chaos-dock-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={17} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Network Chaos Inspector
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          aria-label="Close Chaos panel"
          style={{ padding: '0.2rem 0.4rem' }}
        >
          <X size={15} />
        </button>
      </div>

      <div className="chaos-dock-body">
        {/* Latency controls */}
        <div className="chaos-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Simulated Latency</label>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-accent)' }}>
              {config.minLatency}ms – {config.maxLatency}ms
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: 4 }}>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${config.maxLatency === 0 ? 'btn-primary' : ''}`}
              onClick={() => handleLatencyPreset(0, 0)}
              style={{ flex: 1, padding: '0.25rem' }}
            >
              0ms (Instant)
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${config.minLatency === 200 && config.maxLatency === 3000 ? 'btn-primary' : ''}`}
              onClick={() => handleLatencyPreset(200, 3000)}
              style={{ flex: 1, padding: '0.25rem' }}
              title="Assignment specification: 200ms to 3s"
            >
              200ms–3s (Default)
            </button>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${config.minLatency === 2500 ? 'btn-primary' : ''}`}
              onClick={() => handleLatencyPreset(2500, 4500)}
              style={{ flex: 1, padding: '0.25rem' }}
            >
              Slow 3G (4s)
            </button>
          </div>
        </div>

        {/* Failure rate controls */}
        <div className="chaos-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Random Error Injection</label>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#f43f5e' }}>
              {Math.round(config.failureRate * 100)}% Failure Rate
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: 4 }}>
            {[
              { rate: 0.0, label: '0%' },
              { rate: 0.1, label: '10% (Spec)' },
              { rate: 0.25, label: '25%' },
              { rate: 0.5, label: '50%' },
            ].map(({ rate, label }) => (
              <button
                key={label}
                type="button"
                className={`btn btn-secondary btn-sm ${config.failureRate === rate ? 'btn-primary' : ''}`}
                onClick={() => handleFailureRateChange(rate)}
                style={{ flex: 1, padding: '0.25rem' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Race condition test button */}
        <div className="chaos-field" style={{ marginTop: '0.25rem' }}>
          <label>Race Condition Simulator</label>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Fires 3 queries with inverted delays (2.8s, 1.4s, 0.2s). Visually demonstrates that earlier requests are cancelled and only the newest survives.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleTriggerRace}
            disabled={isSimulatingRace}
            style={{ marginTop: 4 }}
          >
            <Play size={14} />
            <span>{isSimulatingRace ? 'Simulating Inverted Delays...' : 'Trigger Race Condition Test'}</span>
          </button>
        </div>

        {/* Live Network Log Stream */}
        <div className="chaos-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={12} /> Live Network Log ({logs.length})
            </label>
            <button
              type="button"
              onClick={clearNetworkLogs}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          <div className="network-log-list" tabIndex={0} aria-label="Network log activity">
            {logs.length === 0 ? (
              <div style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No network activity recorded yet.
              </div>
            ) : (
              logs.slice(0, 15).map((log) => (
                <div key={log.id} className={`network-log-item ${log.status}`}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>#{log.seq}</strong> {log.paramsSummary}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {log.durationMs !== undefined && <span>{log.durationMs}ms</span>}
                    {log.status === 'success' && <CheckCircle size={12} style={{ color: '#10b981' }} />}
                    {log.status === 'failed' && <XCircle size={12} style={{ color: '#f43f5e' }} />}
                    {log.status === 'aborted' && <Ban size={12} style={{ color: '#f59e0b' }} />}
                    {log.status === 'pending' && <Clock size={12} style={{ color: '#6366f1' }} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
