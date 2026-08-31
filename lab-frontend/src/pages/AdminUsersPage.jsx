import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ROLES = ['LabUser', 'Reviewer', 'Administrator']

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [tempPasswords, setTempPasswords] = useState({}) // userId -> temp password just generated

  function reload() {
    api.get('/admin/users').then(setUsers).catch(err => setError(err.message))
  }

  useEffect(reload, [])

  // Defense in depth: the backend already blocks non-admins with 403,
  // this just avoids showing the page's controls to the wrong role.
  if (user?.role !== 'Administrator') {
    return (
      <div className="app-shell">
        <div className="error-banner">This page is only available to Administrators.</div>
      </div>
    )
  }

  async function changeRole(id, newRole) {
    setError('')
    try {
      await api.patch(`/admin/users/${id}/role`, { newRole })
      reload()
    } catch (err) { setError(err.message) }
  }

  async function toggleActive(id, isActive) {
    setError('')
    try {
      await api.patch(`/admin/users/${id}/active`, { isActive })
      reload()
    } catch (err) { setError(err.message) }
  }

  async function resetPassword(id) {
    setError('')
    try {
      const result = await api.post(`/admin/users/${id}/reset-password`)
      setTempPasswords(prev => ({ ...prev, [id]: result.temporaryPassword }))
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="app-shell">
      <h1>Manage accounts</h1>
      <p style={{ color: 'var(--color-ink-soft)' }}>
        Administrator-only: set roles, deactivate accounts, and issue temporary passwords.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {users.map(u => {
          // You can never deactivate or change the role of your OWN account -
          // the backend already refuses this (AdminService blocks self-lockout),
          // this just makes the UI reflect that instead of offering a button
          // that will always fail with a confusing error.
          const isSelf = u.email === user.email

          return (
            <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {u.fullName} {isSelf && <span style={{ color: 'var(--color-ink-soft)', fontSize: 12 }}>(you)</span>}
                  {!u.isActive && <span style={{ color: 'var(--color-critical)', fontSize: 12 }}> (deactivated)</span>}
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>{u.email}</div>
                {tempPasswords[u.id] && (
                  <div className="mono" style={{ fontSize: 12, color: 'var(--color-teal-dark)', marginTop: 4 }}>
                    New temporary password: {tempPasswords[u.id]}
                  </div>
                )}
              </div>

              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value)}
                disabled={isSelf}
                title={isSelf ? "You can't change your own role" : undefined}
                style={{ padding: 6, borderRadius: 4, border: '1px solid var(--color-border)' }}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <button className="btn btn-secondary" onClick={() => resetPassword(u.id)}>Reset password</button>

              {isSelf ? (
                <button className="btn btn-secondary" disabled title="You can't deactivate your own account">
                  Deactivate
                </button>
              ) : u.isActive ? (
                <button className="btn btn-danger" onClick={() => toggleActive(u.id, false)}>Deactivate</button>
              ) : (
                <button className="btn btn-primary" onClick={() => toggleActive(u.id, true)}>Reactivate</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}