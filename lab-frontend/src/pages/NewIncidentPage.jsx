import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/newIncident.css'

const CATEGORIES = [
    'Chemical Spill',
    'Equipment Failure',
    'Gas Leak',
    'Biological Exposure',
    'Fire/Burn',
    'Slip/Fall',
    'Other',
]

const SEVERITIES = [
    'Low',
    'Medium',
    'High',
    'Critical',
]

export default function NewIncidentPage() {
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: CATEGORIES[0],
        severity: 'Low',
        equipment: '',
        occurredAtUtc: new Date()
            .toISOString()
            .slice(0, 16),
    })

    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const navigate = useNavigate()

    function update(key, value) {
        setForm(prev => ({
            ...prev,
            [key]: value,
        }))

        if (error) {
            setError('')
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()

        setError('')
        setSaving(true)

        try {
            const created = await api.post('/incidents', {
                ...form,
                occurredAtUtc: new Date(
                    form.occurredAtUtc
                ).toISOString(),
            })

            navigate(`/incidents/${created.id}`)
        } catch (err) {
            setError(
                err?.message ||
                'Unable to create the incident. Please try again.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="page new-incident-page">

            <div className="app-shell">

                {/* =====================================================
            HEADER
        ===================================================== */}

                <section className="new-incident-header">

                    <div>

                        <div className="dashboard-eyebrow">
                            SAFETY REPORTING
                        </div>

                        <h1 className="new-incident-title">
                            Log a new incident
                        </h1>

                        <p className="new-incident-subtitle">
                            Record a laboratory incident with the
                            details needed for review and follow-up.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/incidents')}
                    >
                        ← Back to incidents
                    </button>

                </section>


                {/* =====================================================
            SAFETY NOTICE
        ===================================================== */}

                <section className="new-incident-notice">

                    <div className="new-incident-notice-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Report incidents as soon as possible
                        </strong>

                        <p>
                            Describe what you observed clearly.
                            Accurate information helps your laboratory
                            team respond and prevent similar incidents.
                        </p>

                    </div>

                </section>


                {/* =====================================================
            ERROR
        ===================================================== */}

                {error && (
                    <div className="error-banner new-incident-error">

                        <strong>
                            Unable to save incident
                        </strong>

                        <span>
                            {error}
                        </span>

                    </div>
                )}


                {/* =====================================================
            FORM
        ===================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="card new-incident-card"
                >

                    {/* ===================================================
              SECTION 1 — INCIDENT DETAILS
          =================================================== */}

                    <section className="new-incident-section">

                        <div className="new-incident-section-header">

                            <div className="new-incident-section-icon">
                                01
                            </div>

                            <div>

                                <div className="new-incident-kicker">
                                    INCIDENT DETAILS
                                </div>

                                <h2>
                                    What happened?
                                </h2>

                                <p>
                                    Start with a clear title and description
                                    of the event.
                                </p>

                            </div>

                        </div>


                        <div className="new-incident-form-grid">

                            {/* TITLE */}

                            <div className="field new-incident-full">

                                <label htmlFor="incident-title">
                                    Title
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="incident-title"
                                    value={form.title}
                                    onChange={e =>
                                        update('title', e.target.value)
                                    }
                                    placeholder="e.g. Chemical spill near fume hood"
                                    required
                                    maxLength={150}
                                />

                                <div className="field-hint">
                                    Use a short, descriptive title.
                                </div>

                            </div>


                            {/* DESCRIPTION */}

                            <div className="field new-incident-full">

                                <label htmlFor="incident-description">
                                    Description
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="incident-description"
                                    value={form.description}
                                    onChange={e =>
                                        update(
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Describe what happened, what you observed, and any immediate actions that were taken..."
                                    required
                                    maxLength={4000}
                                    rows={7}
                                />

                                <div className="field-hint field-hint-row">

                                    <span>
                                        Focus on observable facts.
                                    </span>

                                    <span>
                                        {form.description.length}/4000
                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ===================================================
              SECTION 2 — CLASSIFICATION
          =================================================== */}

                    <section className="new-incident-section">

                        <div className="new-incident-section-header">

                            <div className="new-incident-section-icon">
                                02
                            </div>

                            <div>

                                <div className="new-incident-kicker">
                                    CLASSIFICATION
                                </div>

                                <h2>
                                    Categorize the incident
                                </h2>

                                <p>
                                    Choose the category and severity that
                                    best describe the event.
                                </p>

                            </div>

                        </div>


                        <div className="new-incident-form-grid">

                            {/* CATEGORY */}

                            <div className="field">

                                <label htmlFor="incident-category">
                                    Category
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="incident-category"
                                    value={form.category}
                                    onChange={e =>
                                        update('category', e.target.value)
                                    }
                                >

                                    {CATEGORIES.map(category => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}

                                </select>

                            </div>


                            {/* SEVERITY */}

                            <div className="field">

                                <label htmlFor="incident-severity">
                                    Severity
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="incident-severity"
                                    value={form.severity}
                                    onChange={e =>
                                        update('severity', e.target.value)
                                    }
                                >

                                    {SEVERITIES.map(severity => (
                                        <option
                                            key={severity}
                                            value={severity}
                                        >
                                            {severity}
                                        </option>
                                    ))}

                                </select>


                                <div className="new-incident-severity-preview">

                                    <span
                                        className={
                                            `severity-pill severity-${form.severity.toLowerCase()}`
                                        }
                                    >

                                        <span className="severity-pill-dot" />

                                        {form.severity} severity

                                    </span>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ===================================================
              SECTION 3 — CONTEXT
          =================================================== */}

                    <section className="new-incident-section">

                        <div className="new-incident-section-header">

                            <div className="new-incident-section-icon">
                                03
                            </div>

                            <div>

                                <div className="new-incident-kicker">
                                    INCIDENT CONTEXT
                                </div>

                                <h2>
                                    Equipment & timing
                                </h2>

                                <p>
                                    Add useful context about where and when
                                    the incident occurred.
                                </p>

                            </div>

                        </div>


                        <div className="new-incident-form-grid">

                            {/* EQUIPMENT */}

                            <div className="field">

                                <label htmlFor="incident-equipment">
                                    Equipment / context
                                    <span className="optional-label">
                                        Optional
                                    </span>
                                </label>

                                <input
                                    id="incident-equipment"
                                    value={form.equipment}
                                    onChange={e =>
                                        update(
                                            'equipment',
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Centrifuge C-04"
                                    maxLength={150}
                                />

                                <div className="field-hint">
                                    Equipment, workstation, room or
                                    other relevant context.
                                </div>

                            </div>


                            {/* DATE */}

                            <div className="field">

                                <label htmlFor="incident-date">
                                    Occurred at
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="incident-date"
                                    type="datetime-local"
                                    value={form.occurredAtUtc}
                                    onChange={e =>
                                        update(
                                            'occurredAtUtc',
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                                <div className="field-hint">
                                    Select the date and approximate time
                                    of the incident.
                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ===================================================
              FORM FOOTER
          =================================================== */}

                    <footer className="new-incident-footer">

                        <div className="new-incident-required">

                            <span className="required-mark">
                                *
                            </span>

                            Required fields

                        </div>


                        <div className="new-incident-actions">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/incidents')}
                                disabled={saving}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="btn btn-primary new-incident-submit"
                                disabled={saving}
                            >

                                {saving ? (
                                    <>
                                        <span className="button-spinner" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span>
                                            ✓
                                        </span>
                                        Create incident
                                    </>
                                )}

                            </button>

                        </div>

                    </footer>

                </form>


                {/* =====================================================
            FOOTNOTE
        ===================================================== */}

                <div className="new-incident-footnote">

                    <span className="new-incident-footnote-icon">
                        ✓
                    </span>

                    <span>
                        Your report contributes to a safer
                        laboratory environment.
                    </span>

                </div>

            </div>

        </main>
    )
}