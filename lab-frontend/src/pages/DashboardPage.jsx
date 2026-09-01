import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const TILES = [
    {
        key: 'Open',
        label: 'Open incidents',
        icon: '●',
        description: 'Waiting for action',
        className: 'dashboard-stat-open',
    },
    {
        key: 'Investigating',
        label: 'Investigating',
        icon: '◌',
        description: 'Currently being reviewed',
        className: 'dashboard-stat-investigating',
    },
    {
        key: 'Resolved',
        label: 'Resolved',
        icon: '✓',
        description: 'Successfully resolved',
        className: 'dashboard-stat-resolved',
    },
    {
        key: 'Closed',
        label: 'Closed',
        icon: '✓',
        description: 'Fully completed',
        className: 'dashboard-stat-closed',
    },
    {
        key: 'Total',
        label: 'Total incidents',
        icon: '▦',
        description: 'All recorded incidents',
        className: 'dashboard-stat-total',
    },
]

export default function DashboardPage() {
    const [counts, setCounts] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        api
            .get('/dashboard/counts')
            .then(setCounts)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="dashboard-page">
            <div className="app-shell">

                {/* =====================================================
            PAGE HEADER
            ===================================================== */}

                <section className="dashboard-header fade-in">

                    <div>
                        <div className="dashboard-eyebrow">
                            LABORATORY OVERVIEW
                        </div>

                        <h1 className="dashboard-title">
                            Dashboard
                        </h1>

                        <p className="dashboard-subtitle">
                            A quick overview of your laboratory incidents
                            and their current status.
                        </p>
                    </div>

                    <div className="dashboard-header-actions">

                        <Link
                            to="/incidents/new"
                            className="btn btn-primary"
                        >
                            <span>＋</span>
                            Log incident
                        </Link>

                    </div>

                </section>


                {/* =====================================================
            ERROR
            ===================================================== */}

                {error && (
                    <div className="error-banner dashboard-error">
                        <strong>Unable to load dashboard.</strong>
                        <span>{error}</span>
                    </div>
                )}


                {/* =====================================================
            STATISTICS
            ===================================================== */}

                <section className="dashboard-stats">

                    {TILES.map((tile, index) => (

                        <Link
                            key={tile.key}
                            to={
                                tile.key === 'Total'
                                    ? '/incidents'
                                    : `/incidents?status=${tile.key}`
                            }
                            className={`dashboard-stat-card ${tile.className} slide-up`}
                            style={{
                                animationDelay: `${index * 60}ms`,
                            }}
                        >

                            <div className="dashboard-stat-top">

                                <div className="dashboard-stat-icon">
                                    {tile.icon}
                                </div>

                                <span className="dashboard-stat-arrow">
                                    ↗
                                </span>

                            </div>

                            <div className="dashboard-stat-number">
                                {loading
                                    ? '—'
                                    : counts
                                        ? counts[tile.key] ?? 0
                                        : 0}
                            </div>

                            <div className="dashboard-stat-label">
                                {tile.label}
                            </div>

                            <div className="dashboard-stat-description">
                                {tile.description}
                            </div>

                        </Link>

                    ))}

                </section>


                {/* =====================================================
            QUICK ACTIONS + SYSTEM OVERVIEW
            ===================================================== */}

                <section className="dashboard-lower-grid">

                    {/* Quick actions */}

                    <div className="dashboard-panel card">

                        <div className="dashboard-panel-header">

                            <div>
                                <div className="dashboard-panel-kicker">
                                    QUICK ACTIONS
                                </div>

                                <h2>
                                    What would you like to do?
                                </h2>
                            </div>

                        </div>


                        <div className="quick-actions">

                            <Link
                                to="/incidents/new"
                                className="quick-action"
                            >

                                <div className="quick-action-icon quick-action-teal">
                                    ＋
                                </div>

                                <div>
                                    <strong>
                                        Report an incident
                                    </strong>

                                    <span>
                                        Record a new laboratory incident
                                    </span>
                                </div>

                                <span className="quick-action-arrow">
                                    →
                                </span>

                            </Link>


                            <Link
                                to="/incidents"
                                className="quick-action"
                            >

                                <div className="quick-action-icon quick-action-blue">
                                    ▤
                                </div>

                                <div>
                                    <strong>
                                        View all incidents
                                    </strong>

                                    <span>
                                        Browse and manage incident records
                                    </span>
                                </div>

                                <span className="quick-action-arrow">
                                    →
                                </span>

                            </Link>


                            <Link
                                to="/ask-ai"
                                className="quick-action"
                            >

                                <div className="quick-action-icon quick-action-purple">
                                    ✦
                                </div>

                                <div>
                                    <strong>
                                        Ask the AI assistant
                                    </strong>

                                    <span>
                                        Get guidance from the safety knowledge base
                                    </span>
                                </div>

                                <span className="quick-action-arrow">
                                    →
                                </span>

                            </Link>


                            <Link
                                to="/documents"
                                className="quick-action"
                            >

                                <div className="quick-action-icon quick-action-orange">
                                    ▣
                                </div>

                                <div>
                                    <strong>
                                        Knowledge base
                                    </strong>

                                    <span>
                                        Explore laboratory safety documents
                                    </span>
                                </div>

                                <span className="quick-action-arrow">
                                    →
                                </span>

                            </Link>

                        </div>

                    </div>


                    {/* Status overview */}

                    <div className="dashboard-panel dashboard-overview card">

                        <div className="dashboard-panel-header">

                            <div>
                                <div className="dashboard-panel-kicker">
                                    INCIDENT HEALTH
                                </div>

                                <h2>
                                    Current overview
                                </h2>
                            </div>

                        </div>


                        <div className="overview-content">

                            <div className="overview-ring">

                                <div className="overview-ring-inner">

                                    <span>
                                        {loading
                                            ? '—'
                                            : counts?.Total ?? 0}
                                    </span>

                                    <small>
                                        incidents
                                    </small>

                                </div>

                            </div>


                            <div className="overview-legend">

                                <OverviewRow
                                    dotClass="overview-dot-open"
                                    label="Open"
                                    value={counts?.Open}
                                />

                                <OverviewRow
                                    dotClass="overview-dot-investigating"
                                    label="Investigating"
                                    value={counts?.Investigating}
                                />

                                <OverviewRow
                                    dotClass="overview-dot-resolved"
                                    label="Resolved"
                                    value={counts?.Resolved}
                                />

                                <OverviewRow
                                    dotClass="overview-dot-closed"
                                    label="Closed"
                                    value={counts?.Closed}
                                />

                            </div>

                        </div>


                        <Link
                            to="/incidents"
                            className="overview-link"
                        >
                            View incident register
                            <span>→</span>
                        </Link>

                    </div>

                </section>


                {/* =====================================================
            SAFETY MESSAGE
            ===================================================== */}

                <section className="dashboard-safety-card">

                    <div className="dashboard-safety-icon">
                        🛡️
                    </div>

                    <div className="dashboard-safety-content">

                        <div className="dashboard-safety-title">
                            Laboratory safety first
                        </div>

                        <p>
                            Every incident is an opportunity to identify
                            risks, learn from what happened, and improve
                            laboratory safety.
                        </p>

                    </div>

                    <Link
                        to="/ask-ai"
                        className="dashboard-safety-link"
                    >
                        Get safety guidance →
                    </Link>

                </section>

            </div>
        </main>
    )
}


/* =========================================================
   OVERVIEW ROW
   ========================================================= */

function OverviewRow({ dotClass, label, value }) {
    return (
        <div className="overview-row">

            <div className="overview-label">

                <span className={`overview-dot ${dotClass}`} />

                <span>
                    {label}
                </span>

            </div>

            <strong>
                {value ?? 0}
            </strong>

        </div>
    )
}