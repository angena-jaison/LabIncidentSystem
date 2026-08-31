import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import DocStatusBadge from '../components/DocStatusBadge'

export default function DocumentsPage() {
  const [docs, setDocs] = useState([])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()

  const canUpload = user?.role === 'Reviewer' || user?.role === 'Administrator'
  const canApprove = user?.role === 'Administrator'

  function reload() {
    api.get('/documents').then(setDocs).catch(err => setError(err.message))
  }

  useEffect(reload, [])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setError('Choose a .txt or .pdf file first.'); return }
    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title || file.name)
      await api.postForm('/documents/upload', formData)
      setTitle('')
      setFile(null)
      e.target.reset()
      reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function approve(id) {
    setError('')
    try {
      await api.patch(`/documents/${id}/approve`, {})
      reload()
    } catch (err) { setError(err.message) }
  }

  async function reject(id) {
    setError('')
    try {
      await api.patch(`/documents/${id}/reject`, {})
      reload()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="app-shell" style={{ maxWidth: 760 }}>
      <h1>Knowledge base</h1>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        Reviewers and Administrators can upload candidate documents (.txt or .pdf).
        A Reviewer's upload is only used by the AI assistant once an{' '}
        <strong>Administrator approves it</strong>. An Administrator's own upload
        is approved automatically. This keeps the assistant grounded in vetted
        material only — never the open internet.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {canUpload && (
        <form onSubmit={handleUpload} className="card" style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Document title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fume Hood Safety Procedure" />
          </div>
          <div className="field">
            <label>File (.txt or .pdf)</label>
            <input type="file" accept=".txt,.pdf" onChange={e => setFile(e.target.files[0])} />
          </div>
          <button className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading & indexing…' : canApprove ? 'Upload (auto-approved)' : 'Submit for approval'}
          </button>
        </form>
      )}

      {docs.length === 0 ? (
        <div className="empty-state">No documents uploaded yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docs.map(d => (
            <div key={d.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{d.title}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>
                    {d.fileName} · {d.chunkCount} indexed chunks · uploaded by {d.uploadedByName}
                  </div>
                  {d.reviewedByName && (
                    <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 2 }}>
                      Reviewed by {d.reviewedByName} on {new Date(d.reviewedAtUtc).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <DocStatusBadge status={d.status} />
              </div>

              {canApprove && d.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={() => approve(d.id)}>Approve</button>
                  <button className="btn btn-danger" onClick={() => reject(d.id)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}