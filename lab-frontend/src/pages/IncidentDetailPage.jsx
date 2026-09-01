import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import "../styles/incidentDetail.css";


// --------------------------------------------------
// STATUS FLOW
// --------------------------------------------------

const NEXT_STATUS = {
    Open: ['Investigating'],
    Investigating: ['Resolved'],
    Resolved: ['Closed', 'Investigating'],
    Closed: []
}


// --------------------------------------------------
// STATUS DISPLAY HELPERS
// --------------------------------------------------

function statusClass(status) {
    switch (status) {
        case 'Open':
            return 'status-badge status-open'

        case 'Investigating':
            return 'status-badge status-investigating'

        case 'Resolved':
            return 'status-badge status-resolved'

        case 'Closed':
            return 'status-badge status-closed'

        default:
            return 'status-badge'
    }
}


function severityClass(severity) {
    switch (severity) {
        case 'Low':
            return 'severity-badge severity-low'

        case 'Medium':
            return 'severity-badge severity-medium'

        case 'High':
            return 'severity-badge severity-high'

        case 'Critical':
            return 'severity-badge severity-critical'

        default:
            return 'severity-badge'
    }
}


// --------------------------------------------------
// DATE / TIME FORMAT
// --------------------------------------------------

function formatDateTime(value) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })
}


// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function IncidentDetailPage() {

    const { id } = useParams()
    const { user } = useAuth()

    const [incident, setIncident] = useState(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [changingStatus, setChangingStatus] = useState(false)

    const [aiSummary, setAiSummary] = useState(null)
    const [generatingAi, setGeneratingAi] = useState(false)

    const [noteText, setNoteText] = useState('')
    const [addingNote, setAddingNote] = useState(false)

    const [actionText, setActionText] = useState('')
    const [actionDueDate, setActionDueDate] = useState('')
    const [addingAction, setAddingAction] = useState(false)


    // --------------------------------------------------
    // LOAD INCIDENT
    // --------------------------------------------------

    async function loadIncident() {
        setLoading(true)
        setError('')

        try {
            const result = await api.get(`/incidents/${id}`)
            setIncident(result)
        } catch (err) {
            setError(err.message || 'Unable to load incident.')
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadIncident()
    }, [id])


    // --------------------------------------------------
    // CHANGE STATUS
    // --------------------------------------------------

    async function changeStatus(newStatus) {

        if (!incident) return

        setChangingStatus(true)
        setError('')

        try {

            await api.patch(`/incidents/${incident.id}/status`, {
                newStatus: newStatus
            })

            await loadIncident()

        } catch (err) {

            setError(
                err.message || 'Unable to change the incident status.'
            )

        } finally {

            setChangingStatus(false)

        }
    }


    // --------------------------------------------------
    // GENERATE AI SUMMARY
    // --------------------------------------------------

    async function generateAiSummary() {

        if (!incident) return

        setGeneratingAi(true)
        setError('')

        try {

            const result = await api.get(
                `/ai/incidents/${incident.id}/summary`
            )

            setAiSummary(result)

        } catch (err) {

            setError(
                err.message || 'Unable to generate AI summary.'
            )

        } finally {

            setGeneratingAi(false)

        }
    }


    // --------------------------------------------------
    // ADD INVESTIGATION NOTE
    // --------------------------------------------------

    async function addNote() {

        if (!noteText.trim() || !incident) return

        setAddingNote(true)
        setError('')

        try {

            await api.post(
                `/incidents/${incident.id}/notes`,
                {
                    content: noteText.trim()
                }
            )

            setNoteText('')

            await loadIncident()

        } catch (err) {

            setError(
                err.message || 'Unable to add investigation note.'
            )

        } finally {

            setAddingNote(false)

        }
    }


    // --------------------------------------------------
    // ADD CORRECTIVE ACTION
    // --------------------------------------------------

    async function addCorrectiveAction() {

        if (!actionText.trim() || !incident) return

        setAddingAction(true)
        setError('')

        try {

            await api.post(
                `/incidents/${incident.id}/corrective-actions`,
                {
                    description: actionText.trim(),
                    dueDateUtc: actionDueDate
                        ? new Date(actionDueDate).toISOString()
                        : null
                }
            )

            setActionText('')
            setActionDueDate('')

            await loadIncident()

        } catch (err) {

            setError(
                err.message || 'Unable to add corrective action.'
            )

        } finally {

            setAddingAction(false)

        }
    }


    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading) {

        return (
            <div className="incident-page">

                <div className="incident-container">

                    <div className="detail-loading">
                        Loading incident...
                    </div>

                </div>

            </div>
        )
    }


    // --------------------------------------------------
    // ERROR / NOT FOUND
    // --------------------------------------------------

    if (!incident) {

        return (
            <div className="incident-page">

                <div className="incident-container">

                    <div className="detail-error">

                        <h2>Unable to load incident</h2>

                        <p>
                            {error || 'Incident not found.'}
                        </p>

                    </div>

                </div>

            </div>
        )
    }


    // --------------------------------------------------
    // PERMISSIONS
    // --------------------------------------------------

    const canChangeStatus =
        user?.role === 'Reviewer' ||
        user?.role === 'Administrator'


    const availableStatuses =
        NEXT_STATUS[incident.status] || []


    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (

        <div className="incident-page">

            <div className="incident-container">


                {/* ==========================================
            ERROR MESSAGE
        ========================================== */}

                {error && (

                    <div className="incident-error">
                        {error}
                    </div>

                )}


                {/* ==========================================
            HERO
        ========================================== */}

                <section className="incident-hero">

                    <div className="incident-eyebrow">
                        INCIDENT #{incident.id}
                    </div>

                    <h1>
                        {incident.title}
                    </h1>

                    <div className="incident-hero-badges">

                        <span className={severityClass(incident.severity)}>
                            <span className="badge-dot"></span>
                            {incident.severity}
                        </span>

                        <span className={statusClass(incident.status)}>
                            <span className="badge-dot"></span>
                            {incident.status}
                        </span>

                    </div>

                </section>


                {/* ==========================================
            INCIDENT INFORMATION
        ========================================== */}

                <section className="detail-card">

                    <div className="section-heading">

                        <div>
                            <span className="section-kicker">
                                INCIDENT INFORMATION
                            </span>

                            <h2>Incident details</h2>
                        </div>

                    </div>


                    <div className="incident-description">
                        {incident.description}
                    </div>


                    <div className="detail-grid">

                        <div className="detail-item">

                            <span className="detail-label">
                                Category
                            </span>

                            <span className="detail-value">
                                {incident.category || '—'}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Equipment
                            </span>

                            <span className="detail-value">
                                {incident.equipment || '—'}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Occurred
                            </span>

                            <span className="detail-value">
                                {formatDateTime(incident.occurredAtUtc)}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Reported by
                            </span>

                            <span className="detail-value">
                                {incident.createdByName || '—'}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Last updated
                            </span>

                            <span className="detail-value">
                                {formatDateTime(incident.updatedAtUtc)}
                            </span>

                        </div>

                    </div>

                </section>


                {/* ==========================================
            STATUS WORKFLOW
        ========================================== */}

                <section className="detail-card workflow-card">

                    <div className="section-heading">

                        <div>

                            <span className="section-kicker">
                                INCIDENT WORKFLOW
                            </span>

                            <h2>
                                Change incident status
                            </h2>

                        </div>

                    </div>


                    <div className="current-status-row">

                        <span>
                            Current status
                        </span>

                        <span className={statusClass(incident.status)}>
                            <span className="badge-dot"></span>
                            {incident.status}
                        </span>

                    </div>


                    {canChangeStatus && availableStatuses.length > 0 ? (

                        <div className="status-actions">

                            {availableStatuses.map(nextStatus => (

                                <button
                                    key={nextStatus}
                                    className={`status-action-btn ${nextStatus === 'Closed'
                                            ? 'status-action-danger'
                                            : nextStatus === 'Investigating'
                                                ? 'status-action-secondary'
                                                : 'status-action-primary'
                                        }`}
                                    onClick={() => changeStatus(nextStatus)}
                                    disabled={changingStatus}
                                >

                                    {changingStatus
                                        ? 'Updating...'
                                        : `Move to ${nextStatus}`}

                                </button>

                            ))}

                        </div>

                    ) : (

                        <div className="workflow-message">

                            {incident.status === 'Closed'
                                ? 'This incident is closed and has no further status transitions.'
                                : canChangeStatus
                                    ? 'No further status transitions are available.'
                                    : 'Only Reviewers and Administrators can change the incident status.'}

                        </div>

                    )}

                </section>


                {/* ==========================================
            AI ASSISTANCE
        ========================================== */}

                <section className="detail-card ai-card">

                    <div className="ai-header">

                        <div>

                            <span className="section-kicker">
                                AI ASSISTANCE
                            </span>

                            <h2>
                                AI summary & next step
                            </h2>

                        </div>

                        <button
                            className="btn-ai"
                            onClick={generateAiSummary}
                            disabled={generatingAi}
                        >

                            {generatingAi
                                ? 'Generating...'
                                : 'Generate'}

                        </button>

                    </div>


                    {aiSummary ? (

                        <div className="ai-result">

                            <div className="ai-result-block">

                                <h3>Summary</h3>

                                <div className="ai-text">
                                    {aiSummary.summary}
                                </div>

                            </div>


                            {aiSummary.suggestedNextStep && (

                                <div className="ai-next-step">

                                    <span className="next-step-label">
                                        Suggested next step
                                    </span>

                                    <p>
                                        {aiSummary.suggestedNextStep}
                                    </p>

                                </div>

                            )}

                        </div>

                    ) : (

                        <p className="empty-description">
                            Generate an AI-powered summary and suggested next
                            investigative step using the approved knowledge base.
                        </p>

                    )}

                </section>


                {/* ==========================================
            INVESTIGATION NOTES
        ========================================== */}

                <section className="detail-card">

                    <div className="section-heading">

                        <div>

                            <span className="section-kicker">
                                INVESTIGATION
                            </span>

                            <h2>
                                Investigation notes
                            </h2>

                        </div>

                        <span className="section-count">
                            {incident.investigationNotes?.length || 0}
                        </span>

                    </div>


                    {incident.investigationNotes?.length > 0 ? (

                        <div className="notes-list">

                            {incident.investigationNotes.map(note => (

                                <div
                                    className="note-item"
                                    key={note.id}
                                >

                                    <div className="note-content">
                                        {note.content}
                                    </div>

                                    <div className="note-meta">

                                        <span>
                                            {note.authorName}
                                        </span>

                                        <span>
                                            {formatDateTime(note.createdAtUtc)}
                                        </span>

                                    </div>

                                </div>

                            ))}

                        </div>

                    ) : (

                        <p className="empty-description">
                            No investigation notes yet.
                        </p>

                    )}


                    <div className="add-form">

                        <input
                            type="text"
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Add an investigation note..."
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    addNote()
                                }
                            }}
                        />

                        <button
                            className="btn-primary"
                            onClick={addNote}
                            disabled={
                                addingNote ||
                                !noteText.trim()
                            }
                        >

                            {addingNote
                                ? 'Adding...'
                                : 'Add'}

                        </button>

                    </div>

                </section>


                {/* ==========================================
            CORRECTIVE ACTIONS
        ========================================== */}

                <section className="detail-card">

                    <div className="section-heading">

                        <div>

                            <span className="section-kicker">
                                FOLLOW-UP
                            </span>

                            <h2>
                                Corrective actions
                            </h2>

                        </div>

                        <span className="section-count">
                            {incident.correctiveActions?.length || 0}
                        </span>

                    </div>


                    {incident.correctiveActions?.length > 0 ? (

                        <div className="actions-list">

                            {incident.correctiveActions.map(action => (

                                <div
                                    className="action-item"
                                    key={action.id}
                                >

                                    <div className="action-main">

                                        <span className="action-description">
                                            {action.description}
                                        </span>

                                        <div className="action-meta">

                                            {action.dueDateUtc && (

                                                <span>
                                                    Due {formatDateTime(action.dueDateUtc)}
                                                </span>

                                            )}

                                        </div>

                                    </div>


                                    <span
                                        className={
                                            action.isCompleted
                                                ? 'completion-badge completed'
                                                : 'completion-badge pending'
                                        }
                                    >

                                        {action.isCompleted
                                            ? 'Completed'
                                            : 'Pending'}

                                    </span>

                                </div>

                            ))}

                        </div>

                    ) : (

                        <p className="empty-description">
                            No corrective actions logged yet.
                        </p>

                    )}


                    <div className="corrective-form">

                        <input
                            type="text"
                            value={actionText}
                            onChange={e => setActionText(e.target.value)}
                            placeholder="Add a corrective action..."
                        />

                        <input
                            type="date"
                            value={actionDueDate}
                            onChange={e => setActionDueDate(e.target.value)}
                        />

                        <button
                            className="btn-primary"
                            onClick={addCorrectiveAction}
                            disabled={
                                addingAction ||
                                !actionText.trim()
                            }
                        >

                            {addingAction
                                ? 'Adding...'
                                : 'Add'}

                        </button>

                    </div>

                </section>


            </div>

        </div>
    )
}