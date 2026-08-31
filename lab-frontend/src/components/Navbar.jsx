import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkStyle = ({ isActive }) => ({
  padding: '8px 4px',
  color: isActive ? 'var(--color-teal-dark)' : 'var(--color-ink-soft)',
  fontWeight: isActive ? 600 : 500,
  textDecoration: 'none',
  borderBottom: isActive ? '2px solid var(--color-teal)' : '2px solid transparent',
})

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header style={{
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-paper-raised)',
    }}>
      <div className="app-shell" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
            LabTrack
          </span>
          {user && (
            <nav style={{ display: 'flex', gap: 20 }}>
              <NavLink to="/" style={linkStyle} end>Dashboard</NavLink>
              <NavLink to="/incidents" style={linkStyle}>Incidents</NavLink>
              <NavLink to="/incidents/new" style={linkStyle}>New Incident</NavLink>
              <NavLink to="/documents" style={linkStyle}>Knowledge Base</NavLink>
              <NavLink to="/ask-ai" style={linkStyle}>Ask AI</NavLink>
              {user.role === 'Administrator' && (
                <NavLink to="/admin/users" style={linkStyle}>Admin</NavLink>
              )}
            </nav>
          )}
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }} className="mono">
              {user.fullName} · {user.role}
            </span>
            <button className="btn btn-secondary" onClick={() => { logout(); navigate('/login') }}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
