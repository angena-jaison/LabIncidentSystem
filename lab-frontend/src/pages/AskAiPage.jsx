import { useState } from 'react'
import { api } from '../api/client'

export default function AskAiPage() {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState([]) // list of {question, response}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAsk(e) {
    e.preventDefault()
    if (!question.trim()) return
    setError('')
    setLoading(true)
    const askedQuestion = question
    setQuestion('')
    try {
      const response = await api.post('/ai/ask', { question: askedQuestion })
      setHistory(prev => [{ question: askedQuestion, response }, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell" style={{ maxWidth: 760 }}>
      <h1>Ask the AI assistant</h1>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        Answers are grounded in the uploaded knowledge base only. If nothing relevant
        has been uploaded, the assistant will say so instead of guessing.
      </p>

      <form onSubmit={handleAsk} className="card" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input style={{ flex: 1, padding: 9, border: '1px solid var(--color-border)', borderRadius: 4 }}
               placeholder="e.g. What should I do if a centrifuge overheats?"
               value={question} onChange={e => setQuestion(e.target.value)} />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Thinking…' : 'Ask'}</button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {history.map((entry, i) => (
          <div key={i} className="card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Q: {entry.question}</div>

            {!entry.response.isGrounded && (
              <div className="error-banner" style={{ background: '#FDF3E3', color: '#8A6116', border: '1px solid #F0DBA8' }}>
                Not grounded in the knowledge base — treat this answer with caution.
              </div>
            )}

            <ul style={{ margin: '0 0 8px 0', paddingLeft: 18 }}>
  {entry.response.answer.split('\n').filter(line => line.trim()).map((line, k) => (
    <li key={k} style={{ marginBottom: 4 }}>{line.replace(/^-\s*/, '')}</li>
  ))}
</ul>

            {entry.response.sources?.length > 0 && (
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--color-ink-soft)' }}>
                  Sources ({entry.response.sources.length})
                </summary>
                <ul style={{ fontSize: 13 }}>
                  {entry.response.sources.map((s, j) => (
                    <li key={j}>
                      <strong>{s.documentTitle}</strong> (chunk {s.chunkIndex}, similarity {s.similarityScore}) — <em>{s.snippet}</em>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
