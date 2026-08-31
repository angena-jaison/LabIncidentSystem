import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(fullName, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-paper)',
    }}>
      <div className="card" style={{ width: 380 }}>
        <h1 style={{ fontSize: 26 }}>LabTrack</h1>
        <p style={{ color: 'var(--color-ink-soft)', marginTop: 0, marginBottom: 20 }}>
          Laboratory incident tracking &amp; AI knowledge assistant
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
          {mode === 'login' ? (
            <>No account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register') }}>Register</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login') }}>Log in</a></>
          )}
        </p>

        <p className="mono" style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 12 }}>
          Demo login: admin@lab.local / Admin123!
        </p>
      </div>
    </div>
  )
}
