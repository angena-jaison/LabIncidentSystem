import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/incidentsList.css'

const STATUS_OPTIONS = [
    'All',
    'Open',
    'Investigating',
    'Resolved',
    'Closed',
]

const SEVERITY_OPTIONS = [
    'All',
    'Low',
    'Medium',
    'High',
    'Critical',
]

export default function IncidentsListPage() {

    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [searchParams] = useSearchParams()

    const initialStatus =
        searchParams.get('status') || 'All'

    const [statusFilter, setStatusFilter] =
        useState(initialStatus)

    const [severityFilter, setSeverityFilter] =
        useState('All')

    const [search, setSearch] =
        useState('')


    /* =========================================================
       LOAD INCIDENTS
       ========================================================= */

    useEffect(() => {
        loadIncidents()
    }, [])


    async function loadIncidents() {

        try {

            setLoading(true)
            setError('')

            const data = await api.get('/incidents')

            setIncidents(
                Array.isArray(data)
                    ? data
                    : data?.items ||
                    data?.incidents ||
                    []
            )

        } catch (err) {

            setError(
                err?.message ||
                'Unable to load incidents.'
            )

        } finally {

            setLoading(false)

        }
    }


    /* =========================================================
       FILTERING
       ========================================================= */

    const filteredIncidents = useMemo(() => {

        const searchValue =
            search.trim().toLowerCase()

        return incidents.filter(incident => {

            const incidentStatus =
                incident.status ||
                incident.Status ||
                ''

            const incidentSeverity =
                incident.severity ||
                incident.Severity ||
                ''

            const matchesStatus =
                statusFilter === 'All' ||
                incidentStatus.toLowerCase() ===
                statusFilter.toLowerCase()

            const matchesSeverity =
                severityFilter === 'All' ||
                incidentSeverity.toLowerCase() ===
                severityFilter.toLowerCase()

            const searchableText = [
                incident.title,
                incident.Title,

                incident.description,
                incident.Description,

                incident.location,
                incident.Location,

                incident.category,
                incident.Category,

                incident.reportedBy,
                incident.ReportedBy,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            const matchesSearch =
                !searchValue ||
                searchableText.includes(searchValue)

            return (
                matchesStatus &&
                matchesSeverity &&
                matchesSearch
            )

        })

    }, [
        incidents,
        statusFilter,
        severityFilter,
        search,
    ])


    /* =========================================================
       QUICK STATISTICS
       ========================================================= */

    const openCount =
        incidents.filter(
            incident =>
                String(
                    incident.status ||
                    incident.Status ||
                    ''
                ).toLowerCase() === 'open'
        ).length


    const investigatingCount =
        incidents.filter(
            incident =>
                String(
                    incident.status ||
                    incident.Status ||
                    ''
                ).toLowerCase() === 'investigating'
        ).length


    const criticalCount =
        incidents.filter(
            incident =>
                String(
                    incident.severity ||
                    incident.Severity ||
                    ''
                ).toLowerCase() === 'critical'
        ).length


    /* =========================================================
       RESET
       ========================================================= */

    function resetFilters() {

        setSearch('')
        setStatusFilter('All')
        setSeverityFilter('All')

    }


    /* =========================================================
       RENDER
       ========================================================= */

    return (

        <main className="page incidents-page">

            <div className="app-shell">


                {/* =================================================
                    HEADER
                ================================================= */}

                <section className="page-header incidents-header">

                    <div className="incidents-heading">

                        <div className="dashboard-eyebrow">
                            INCIDENT REGISTER
                        </div>

                        <h1 className="page-title">
                            Laboratory Incidents
                        </h1>

                        <p className="page-subtitle">
                            Review, track and manage reported
                            laboratory incidents.
                        </p>

                    </div>


                    <Link
                        to="/incidents/new"
                        className="btn btn-primary incident-report-button"
                    >

                        <span className="button-icon">
                            ＋
                        </span>

                        Report incident

                    </Link>

                </section>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="incident-stat-grid">

                    <div className="incident-stat-card">

                        <div className="incident-stat-icon">
                            #
                        </div>

                        <div>

                            <span>
                                Total incidents
                            </span>

                            <strong>
                                {incidents.length}
                            </strong>

                        </div>

                    </div>


                    <div className="incident-stat-card">

                        <div className="incident-stat-icon incident-stat-open">
                            ○
                        </div>

                        <div>

                            <span>
                                Open
                            </span>

                            <strong>
                                {openCount}
                            </strong>

                        </div>

                    </div>


                    <div className="incident-stat-card">

                        <div className="incident-stat-icon incident-stat-investigating">
                            ◌
                        </div>

                        <div>

                            <span>
                                Investigating
                            </span>

                            <strong>
                                {investigatingCount}
                            </strong>

                        </div>

                    </div>


                    <div className="incident-stat-card">

                        <div className="incident-stat-icon incident-stat-critical">
                            !
                        </div>

                        <div>

                            <span>
                                Critical
                            </span>

                            <strong>
                                {criticalCount}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="error-banner incident-error">

                        <strong>
                            Unable to load incidents.
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* =================================================
                    FILTER PANEL
                ================================================= */}

                <section className="incident-filter-card card">

                    <div className="incident-filter-top">

                        <div>

                            <div className="dashboard-panel-kicker">
                                FIND INCIDENTS
                            </div>

                            <h2>
                                Incident records
                            </h2>

                            <p className="incident-filter-description">
                                Search and filter laboratory
                                incident records.
                            </p>

                        </div>


                        <div className="incident-count">

                            <strong>
                                {filteredIncidents.length}
                            </strong>

                            <span>
                                {filteredIncidents.length === 1
                                    ? 'record'
                                    : 'records'}
                            </span>

                        </div>

                    </div>


                    <div className="incident-filters">


                        {/* SEARCH */}

                        <div className="incident-search">

                            <span className="incident-search-icon">
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search by title, category, location..."
                                value={search}
                                onChange={e =>
                                    setSearch(e.target.value)
                                }
                            />

                            {search && (

                                <button
                                    type="button"
                                    className="incident-search-clear"
                                    onClick={() =>
                                        setSearch('')
                                    }
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>

                            )}

                        </div>


                        {/* STATUS */}

                        <div className="incident-filter-field">

                            <label>
                                Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={e =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                            >

                                {STATUS_OPTIONS.map(option => (

                                    <option
                                        key={option}
                                        value={option}
                                    >
                                        {option}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* SEVERITY */}

                        <div className="incident-filter-field">

                            <label>
                                Severity
                            </label>

                            <select
                                value={severityFilter}
                                onChange={e =>
                                    setSeverityFilter(
                                        e.target.value
                                    )
                                }
                            >

                                {SEVERITY_OPTIONS.map(option => (

                                    <option
                                        key={option}
                                        value={option}
                                    >
                                        {option}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* RESET */}

                        <button
                            type="button"
                            className="btn btn-secondary incident-reset"
                            onClick={resetFilters}
                        >
                            Reset
                        </button>

                    </div>

                </section>


                {/* =================================================
                    INCIDENT TABLE
                ================================================= */}

                <section className="incident-table-card card">


                    {loading ? (

                        <div className="incident-loading">

                            <div className="spinner" />

                            <strong>
                                Loading incidents...
                            </strong>

                            <span>
                                Fetching the latest laboratory records
                            </span>

                        </div>


                    ) : filteredIncidents.length === 0 ? (

                        <div className="empty-state incident-empty">

                            <div className="empty-state-icon">
                                ◇
                            </div>

                            <h3>
                                No incidents found
                            </h3>

                            <p>

                                {incidents.length === 0
                                    ? 'There are no incident records yet.'
                                    : 'Try changing your filters or search term.'
                                }

                            </p>


                            {incidents.length === 0 && (

                                <Link
                                    to="/incidents/new"
                                    className="btn btn-primary"
                                    style={{
                                        marginTop: 18
                                    }}
                                >
                                    Report first incident
                                </Link>

                            )}


                            {incidents.length > 0 && (

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{
                                        marginTop: 18
                                    }}
                                    onClick={resetFilters}
                                >
                                    Clear filters
                                </button>

                            )}

                        </div>


                    ) : (

                        <div className="table-wrapper">

                            <table className="incidents-table">

                                <thead>

                                    <tr>

                                        {/* INCIDENT */}

                                        <th className="incident-column">
                                            Incident
                                        </th>


                                        {/* CATEGORY */}

                                        <th className="category-column">
                                            Category
                                        </th>


                                        {/* SEVERITY */}

                                        <th className="severity-column">
                                            Severity
                                        </th>


                                        {/* STATUS */}

                                        <th className="status-column">
                                            Status
                                        </th>


                                        {/* DATE */}

                                        <th className="date-column">
                                            Date
                                        </th>


                                        {/* ACTION */}

                                        <th className="action-column">
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredIncidents.map(
                                        (incident, index) => {

                                            const id =
                                                incident.id ??
                                                incident.Id ??
                                                incident.incidentId ??
                                                incident.IncidentId


                                            const title =
                                                incident.title ||
                                                incident.Title ||
                                                'Untitled incident'


                                            const description =
                                                incident.description ||
                                                incident.Description ||
                                                ''


                                            const category =
                                                incident.category ||
                                                incident.Category ||
                                                '—'


                                            const severity =
                                                incident.severity ||
                                                incident.Severity ||
                                                'Unknown'


                                            const status =
                                                incident.status ||
                                                incident.Status ||
                                                'Unknown'


                                            const date =
                                                incident.createdAt ||
                                                incident.CreatedAt ||
                                                incident.date ||
                                                incident.Date ||
                                                incident.reportedAt ||
                                                incident.ReportedAt


                                            return (

                                                <tr
                                                    key={
                                                        id ??
                                                        `${title}-${index}`
                                                    }
                                                >


                                                    {/* =================================================
                                                        INCIDENT
                                                    ================================================= */}

                                                    <td className="incident-column">

                                                        <Link
                                                            to={`/incidents/${id}`}
                                                            className="incident-title-link"
                                                        >

                                                            <div className="incident-title-row">

                                                                <div className="incident-row-icon">
                                                                    ⚗
                                                                </div>


                                                                <div className="incident-main-info">

                                                                    <div className="incident-title">
                                                                        {title}
                                                                    </div>


                                                                    {description && (

                                                                        <div className="incident-description">

                                                                            {truncate(
                                                                                description,
                                                                                85
                                                                            )}

                                                                        </div>

                                                                    )}

                                                                </div>

                                                            </div>

                                                        </Link>

                                                    </td>


                                                    {/* =================================================
                                                        CATEGORY
                                                    ================================================= */}

                                                    <td className="category-column">

                                                        <span className="incident-category">
                                                            {category}
                                                        </span>

                                                    </td>


                                                    {/* =================================================
                                                        SEVERITY
                                                    ================================================= */}

                                                    <td className="severity-column">

                                                        <SeverityBadge
                                                            severity={
                                                                severity
                                                            }
                                                        />

                                                    </td>


                                                    {/* =================================================
                                                        STATUS
                                                    ================================================= */}

                                                    <td className="status-column">

                                                        <StatusBadge
                                                            status={
                                                                status
                                                            }
                                                        />

                                                    </td>


                                                    {/* =================================================
                                                        DATE
                                                    ================================================= */}

                                                    <td className="date-column">

                                                        <span className="incident-date">
                                                            {formatDate(date)}
                                                        </span>

                                                    </td>


                                                    {/* =================================================
                                                        ACTION
                                                    ================================================= */}

                                                    <td className="action-column">

                                                        <Link
                                                            to={`/incidents/${id}`}
                                                            className="incident-view-button"
                                                        >

                                                            View

                                                            <span>
                                                                →
                                                            </span>

                                                        </Link>

                                                    </td>

                                                </tr>

                                            )

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                {!loading &&
                    filteredIncidents.length > 0 && (

                        <div className="incident-results-footer">

                            <span>
                                Showing
                            </span>

                            <strong>
                                {filteredIncidents.length}
                            </strong>

                            <span>
                                of
                            </span>

                            <strong>
                                {incidents.length}
                            </strong>

                            <span>
                                incidents
                            </span>

                        </div>

                    )}

            </div>

        </main>

    )
}


/* =========================================================
   SEVERITY BADGE
   ========================================================= */

function SeverityBadge({ severity }) {

    const value =
        String(severity).toLowerCase()

    let className =
        'incident-badge incident-badge-neutral'


    if (value === 'critical') {

        className =
            'incident-badge incident-badge-critical'

    } else if (value === 'high') {

        className =
            'incident-badge incident-badge-high'

    } else if (value === 'medium') {

        className =
            'incident-badge incident-badge-medium'

    } else if (value === 'low') {

        className =
            'incident-badge incident-badge-low'

    }


    return (

        <span className={className}>

            <span className="incident-badge-dot" />

            {severity}

        </span>

    )
}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({ status }) {

    const value =
        String(status).toLowerCase()

    let className =
        'incident-badge incident-badge-neutral'


    if (value === 'open') {

        className =
            'incident-badge incident-status-open'

    } else if (value === 'investigating') {

        className =
            'incident-badge incident-status-investigating'

    } else if (value === 'resolved') {

        className =
            'incident-badge incident-status-resolved'

    } else if (value === 'closed') {

        className =
            'incident-badge incident-status-closed'

    }


    return (

        <span className={className}>

            <span className="incident-badge-dot" />

            {status}

        </span>

    )

}


/* =========================================================
   HELPERS
   ========================================================= */

function truncate(text, length) {

    const value =
        String(text)

    if (value.length <= length) {
        return value
    }

    return `${value.slice(0, length)}…`
}


function formatDate(value) {

    if (!value) {
        return '—'
    }

    const date =
        new Date(value)

    if (Number.isNaN(date.getTime())) {
        return String(value)
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }
    )
}