import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import SeverityBadge from '../components/SeverityBadge'

// What status an incident is allowed to move to next (mirrors the backend rule,
// just for showing the right buttons — the backend is still the source of truth).
const NEXT_STATUS = {
  Open: ['Investigating'],
  Investigating: ['Resolved', 'Open'],
  Resolved: ['Closed', 'Investigating'],
  Closed: [],
}

export default function IncidentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [incident, setIncident] = useState(null)
  const [error, setError] = useState('')
  const [noteText, setNoteText] = useState('')
  const [actionText, setActionText] = useState('')
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  const canReview = user?.role === 'Reviewer' || user?.role === 'Administrator'

  function reload() {
    api.get(`/incidents/${id}`).then(setIncident).catch(err => setError(err.message))
  }

  useEffect(reload, [id])

  async function changeStatus(newStatus) {
    setError('')
    try {
      await api.patch(`/incidents/${id}/status`, { newStatus })
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    await api.post(`/incidents/${id}/notes`, { content: noteText })
    setNoteText('')
    reload()
  }

  async function addAction(e) {
    e.preventDefault()
    if (!actionText.trim()) return
    await api.post(`/incidents/${id}/corrective-actions`, { description: actionText })
    setActionText('')
    reload()
  }

  async function getAiSummary() {
    setSummaryLoading(true)
    setSummaryError('')
    try {
      const result = await api.get(`/ai/incidents/${id}/summary`)
      setSummary(result)
    } catch (err) {
      setSummaryError(err.message)
    } finally {
      setSummaryLoading(false)
    }
  }

  if (error) return <div className="app-shell"><div className="error-banner">{error}</div></div>
  if (!incident) return <div className="app-shell">Loading…</div>

  return (
    <div className="app-shell" style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="mono" style={{ color: 'var(--color-ink-soft)', fontSize: 13 }}>#{incident.id}</div>
          <h1 style={{ margin: '4px 0' }}>{incident.title}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <p>{incident.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: 'var(--color-ink-soft)' }}>
          <div><strong>Category:</strong> {incident.category}</div>
          <div><strong>Equipment:</strong> {incident.equipment || '—'}</div>
          <div><strong>Occurred:</strong> {new Date(incident.occurredAtUtc).toLocaleString()}</div>
          <div><strong>Reported by:</strong> {incident.createdByName}</div>
          <div><strong>Assigned to:</strong> {incident.assignedToName || 'Unassigned'}</div>
          <div><strong>Last updated:</strong> {new Date(incident.updatedAtUtc).toLocaleString()}</div>
        </div>
        {incident.resolutionDetails && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--color-teal-tint)', borderRadius: 6 }}>
            <strong>Resolution:</strong> {incident.resolutionDetails}
          </div>
        )}
      </div>

      {/* --- Workflow actions --- */}
      {canReview && NEXT_STATUS[incident.status]?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>
            Move status
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {NEXT_STATUS[incident.status].map(s => (
              <button key={s} className="btn btn-secondary" onClick={() => changeStatus(s)}>
                Move to {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- AI Summary --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>AI summary &amp; next step</h3>
          <button className="btn btn-secondary" onClick={getAiSummary} disabled={summaryLoading}>
            {summaryLoading ? 'Thinking…' : 'Generate'}
          </button>
        </div>
        {summaryError && <div className="error-banner" style={{ marginTop: 12 }}>{summaryError}</div>}
        {summary && (
          <div style={{ marginTop: 12 }}>
            <p>{summary.summary}</p>
            <p><strong>Suggested next step:</strong> {summary.suggestedNextStep}</p>
            {summary.relatedKnowledge.length > 0 && (
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--color-ink-soft)' }}>
                  Related knowledge used ({summary.relatedKnowledge.length})
                </summary>
                <ul style={{ fontSize: 13 }}>
                  {summary.relatedKnowledge.map((s, i) => (
                    <li key={i}>{s.documentTitle} — <em>{s.snippet}</em> (similarity {s.similarityScore})</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {/* --- Investigation notes --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Investigation notes</h3>
        {incident.investigationNotes?.length ? (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {incident.investigationNotes.map(n => (
              <li key={n.id} style={{ marginBottom: 6 }}>
                {n.content}
                <span className="mono" style={{ color: 'var(--color-ink-soft)', fontSize: 12 }}>
                  {' '}— {n.authorName}, {new Date(n.createdAtUtc).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>No notes yet.</p>
        )}
        <form onSubmit={addNote} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input style={{ flex: 1, padding: 9, border: '1px solid var(--color-border)', borderRadius: 4 }}
                 placeholder="Add an investigation note…" value={noteText} onChange={e => setNoteText(e.target.value)} />
          <button className="btn btn-secondary">Add</button>
        </form>
      </div>

      {/* --- Corrective actions --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Corrective actions</h3>
        {incident.correctiveActions?.length ? (
          <ul style={{ paddingLeft: 18, fontSize: 14 }}>
            {incident.correctiveActions.map(a => (
              <li key={a.id} style={{ marginBottom: 6 }}>
                {a.isCompleted ? '✅' : '⬜️'} {a.description}
                {a.dueDateUtc && (
                  <span className="mono" style={{ color: 'var(--color-ink-soft)', fontSize: 12 }}>
                    {' '}— due {new Date(a.dueDateUtc).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>No corrective actions logged yet.</p>
        )}
        <form onSubmit={addAction} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input style={{ flex: 1, padding: 9, border: '1px solid var(--color-border)', borderRadius: 4 }}
                 placeholder="Add a corrective action…" value={actionText} onChange={e => setActionText(e.target.value)} />
          <button className="btn btn-secondary">Add</button>
        </form>
      </div>
    </div>
  )
}
