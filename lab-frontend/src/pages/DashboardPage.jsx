import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const TILES = [
  { key: 'Open', label: 'Open' },
  { key: 'Investigating', label: 'Investigating' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Closed', label: 'Closed' },
  { key: 'Total', label: 'Total incidents' },
]

export default function DashboardPage() {
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard/counts').then(setCounts).catch(err => setError(err.message))
  }, [])

  return (
    <div className="app-shell">
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        A quick read on where every incident currently stands.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 20 }}>
        {TILES.map(tile => (
          <Link to={tile.key === 'Total' ? '/incidents' : `/incidents?status=${tile.key}`}
                key={tile.key} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {tile.label}
            </div>
            <div className="mono" style={{ fontSize: 34, fontWeight: 600, marginTop: 6 }}>
              {counts ? (counts[tile.key] ?? 0) : '—'}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <Link to="/incidents/new" className="btn btn-primary">Log a new incident</Link>
        <Link to="/ask-ai" className="btn btn-secondary">Ask the AI assistant</Link>
      </div>
    </div>
  )
}
