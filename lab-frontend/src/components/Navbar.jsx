import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const linkClass = ({ isActive }) =>
        `nav-link ${isActive ? 'active' : ''}`

    return (
        <header className="navbar">
            <div className="navbar-inner">

                {/* Brand */}
                <div className="navbar-brand">
                    <div className="navbar-brand-icon">
                        🧪
                    </div>

                    <div>
                        <div style={{ lineHeight: 1 }}>
                            LabTrack
                        </div>

                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: 'var(--color-text-muted)',
                                marginTop: 4,
                            }}
                        >
                            LAB SAFETY PLATFORM
                        </div>
                    </div>
                </div>


                {/* Navigation */}
                {user && (
                    <nav className="navbar-links">

                        <NavLink
                            to="/"
                            end
                            className={linkClass}
                        >
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/incidents"
                            className={linkClass}
                        >
                            Incidents
                        </NavLink>

                        <NavLink
                            to="/incidents/new"
                            className={linkClass}
                        >
                            + New Incident
                        </NavLink>

                        <NavLink
                            to="/documents"
                            className={linkClass}
                        >
                            Knowledge Base
                        </NavLink>

                        <NavLink
                            to="/ask-ai"
                            className={linkClass}
                        >
                            ✦ Ask AI
                        </NavLink>

                        {user.role === 'Administrator' && (
                            <NavLink
                                to="/admin/users"
                                className={linkClass}
                            >
                                Admin
                            </NavLink>
                        )}

                    </nav>
                )}


                {/* User section */}
                {user && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >

                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',

                                display: 'grid',
                                placeItems: 'center',

                                background: 'var(--color-surface-soft)',
                                color: 'var(--color-primary)',

                                fontWeight: 700,
                                fontSize: 14,
                            }}
                            title={user.fullName}
                        >
                            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                lineHeight: 1.2,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: 'var(--color-text)',
                                }}
                            >
                                {user.fullName}
                            </span>

                            <span
                                style={{
                                    fontSize: 11,
                                    color: 'var(--color-text-muted)',
                                    marginTop: 4,
                                }}
                            >
                                {user.role}
                            </span>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                logout()
                                navigate('/login')
                            }}
                        >
                            Log out
                        </button>

                    </div>
                )}

            </div>
        </header>
    )
}