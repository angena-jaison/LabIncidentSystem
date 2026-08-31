import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const CATEGORIES = ['Chemical Spill', 'Equipment Failure', 'Gas Leak', 'Biological Exposure', 'Fire/Burn', 'Slip/Fall', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function NewIncidentPage() {
  const [form, setForm] = useState({
    title: '', description: '', category: CATEGORIES[0], severity: 'Low',
    equipment: '', occurredAtUtc: new Date().toISOString().slice(0, 16),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const created = await api.post('/incidents', {
        ...form,
        occurredAtUtc: new Date(form.occurredAtUtc).toISOString(),
      })
      navigate(`/incidents/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell" style={{ maxWidth: 640 }}>
      <h1>Log a new incident</h1>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={e => update('title', e.target.value)} required maxLength={150} />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} required maxLength={4000} />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Category</label>
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Severity</label>
            <select value={form.severity} onChange={e => update('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Equipment / context (optional)</label>
            <input value={form.equipment} onChange={e => update('equipment', e.target.value)} maxLength={150} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Occurred at</label>
            <input type="datetime-local" value={form.occurredAtUtc} onChange={e => update('occurredAtUtc', e.target.value)} required />
          </div>
        </div>

        <button className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Create incident'}
        </button>
      </form>
    </div>
  )
}
