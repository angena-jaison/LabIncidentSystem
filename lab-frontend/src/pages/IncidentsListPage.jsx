import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import SeverityBadge from '../components/SeverityBadge'

const STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function IncidentsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const status = searchParams.get('status') || ''
  const severity = searchParams.get('severity') || ''
  const search = searchParams.get('search') || ''

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (severity) params.set('severity', severity)
    if (search) params.set('search', search)

    api.get(`/incidents?${params.toString()}`)
      .then(setResult)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [status, severity, search])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="app-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Incidents</h1>
          <p style={{ color: 'var(--color-ink-soft)', margin: 0 }}>
            {result ? `${result.totalCount} incident${result.totalCount === 1 ? '' : 's'} found` : 'Loading…'}
          </p>
        </div>
        <Link to="/incidents/new" className="btn btn-primary">Log a new incident</Link>
      </div>

      {/* --- Filters --- */}
      <div className="card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20, marginBottom: 20 }}>
        <div className="field" style={{ marginBottom: 0, flex: '1 1 220px' }}>
          <label>Search</label>
          <input placeholder="Search title or description…" defaultValue={search}
                 onKeyDown={e => e.key === 'Enter' && updateFilter('search', e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0, width: 180 }}>
          <label>Status</label>
          <select value={status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="">All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0, width: 180 }}>
          <label>Severity</label>
          <select value={severity} onChange={e => updateFilter('severity', e.target.value)}>
            <option value="">All</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && result?.items?.length === 0 && (
        <div className="empty-state">No incidents match these filters yet.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {result?.items?.map(incident => (
          <Link key={incident.id} to={`/incidents/${incident.id}`}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit',
                  borderLeft: `4px solid var(--color-${incident.severity.toLowerCase()})`,
                }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{incident.title}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>
                #{incident.id} · {incident.category} · {new Date(incident.occurredAtUtc).toLocaleString()}
              </div>
            </div>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
