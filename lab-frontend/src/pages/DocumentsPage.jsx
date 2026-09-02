import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import DocStatusBadge from '../components/DocStatusBadge'
import '../styles/documents.css'

export default function DocumentsPage() {
    const [docs, setDocs] = useState([])
    const [title, setTitle] = useState('')
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)

    // ============================================================
    // DOCUMENT PREVIEW
    // ============================================================

    const [viewingDocument, setViewingDocument] = useState(null)
    const [loadingDocument, setLoadingDocument] = useState(false)

    const { user } = useAuth()

    const canUpload =
        user?.role === 'Reviewer' ||
        user?.role === 'Administrator'

    const canApprove =
        user?.role === 'Administrator'

    const canDelete =
        user?.role === 'Administrator'

    // ============================================================
    // LOAD DOCUMENTS
    // ============================================================

    function reload() {
        api.get('/documents')
            .then(setDocs)
            .catch(err => setError(err.message))
    }

    useEffect(() => {
        reload()
    }, [])

    // ============================================================
    // UPLOAD
    // ============================================================

    async function handleUpload(e) {
        e.preventDefault()

        if (!file) {
            setError('Choose a .txt or .pdf file first.')
            return
        }

        setError('')
        setUploading(true)

        try {
            const formData = new FormData()

            formData.append('file', file)

            formData.append(
                'title',
                title || file.name
            )

            await api.postForm(
                '/documents/upload',
                formData
            )

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

    // ============================================================
    // APPROVE
    // ============================================================

    async function approve(id) {
        setError('')

        try {
            await api.patch(
                `/documents/${id}/approve`,
                {}
            )

            reload()
        } catch (err) {
            setError(err.message)
        }
    }

    // ============================================================
    // REJECT
    // ============================================================

    async function reject(id) {
        setError('')

        try {
            await api.patch(
                `/documents/${id}/reject`,
                {}
            )

            reload()
        } catch (err) {
            setError(err.message)
        }
    }

    // ============================================================
    // VIEW ORIGINAL DOCUMENT
    // ============================================================
    //
    // IMPORTANT:
    //
    // We are NO LONGER calling:
    //
    // /documents/{id}/view
    //
    // because that returned extracted FullText.
    //
    // Instead we call:
    //
    // /documents/{id}/file
    //
    // which returns the ORIGINAL uploaded file.
    //
    // We create a temporary browser URL from the returned
    // Blob and display it in an iframe.
    //

    async function viewDocument(document) {
        setError('')
        setLoadingDocument(true)

        try {
            const response = await fetch(
                `http://localhost:5000/api/documents/${document.id}/file`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('labtrack_token')}`
                    }
                }
            )

            if (!response.ok) {
                let message = `Unable to open document (${response.status})`

                try {
                    const data = await response.json()

                    if (data?.Message) {
                        message = data.Message
                    }

                    if (data?.message) {
                        message = data.message
                    }
                } catch {
                    // Response was not JSON.
                }

                throw new Error(message)
            }

            // Get the ORIGINAL file as a Blob.
            const blob = await response.blob()

            // Create a temporary browser URL.
            const fileUrl = URL.createObjectURL(blob)

            setViewingDocument({
                ...document,
                fileUrl
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingDocument(false)
        }
    }

    // ============================================================
    // CLOSE DOCUMENT PREVIEW
    // ============================================================

    function closeDocumentPreview() {
        if (viewingDocument?.fileUrl) {
            URL.revokeObjectURL(viewingDocument.fileUrl)
        }

        setViewingDocument(null)
    }

    // ============================================================
    // DELETE DOCUMENT
    // ============================================================

    async function deleteDocument(id, documentTitle) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${documentTitle}"?\n\nThis will permanently remove the document and its indexed knowledge chunks.`
        )

        if (!confirmed) {
            return
        }

        setError('')

        try {
            await api.del(`/documents/${id}`)

            // If this document is currently being viewed,
            // close the preview.
            if (viewingDocument?.id === id) {
                closeDocumentPreview()
            }

            reload()
        } catch (err) {
            setError(err.message)
        }
    }

    // ============================================================
    // STATISTICS
    // ============================================================

    const pendingCount = docs.filter(
        d => d.status === 'Pending'
    ).length

    const approvedCount = docs.filter(
        d => d.status === 'Approved'
    ).length

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="app-shell documents-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="documents-header">

                <div>

                    <div className="eyebrow">
                        KNOWLEDGE MANAGEMENT
                    </div>

                    <h1 className="documents-title">
                        Knowledge base
                    </h1>

                    <p className="documents-subtitle">
                        Vetted laboratory safety procedures and reference
                        material used to ground the AI assistant.
                    </p>

                </div>

                <div className="documents-header-icon">
                    <span>▤</span>
                </div>

            </div>


            {/* =====================================================
                INFORMATION BANNER
            ===================================================== */}

            <div className="knowledge-banner">

                <div className="knowledge-banner-icon">
                    ✓
                </div>

                <div className="knowledge-banner-content">

                    <strong>
                        AI knowledge is grounded in approved documents
                    </strong>

                    <p>
                        Reviewers can submit documents for approval.
                        Administrator uploads are approved automatically.
                        Only approved material is used by the AI assistant.
                    </p>

                </div>

            </div>


            {/* =====================================================
                STATISTICS
            ===================================================== */}

            <div className="document-stats">

                <div className="document-stat-card">

                    <div className="document-stat-icon total">
                        ▤
                    </div>

                    <div>
                        <span>Total documents</span>
                        <strong>{docs.length}</strong>
                    </div>

                </div>


                <div className="document-stat-card">

                    <div className="document-stat-icon approved">
                        ✓
                    </div>

                    <div>
                        <span>Approved</span>
                        <strong>{approvedCount}</strong>
                    </div>

                </div>


                <div className="document-stat-card">

                    <div className="document-stat-icon pending">
                        ◷
                    </div>

                    <div>
                        <span>Pending review</span>
                        <strong>{pendingCount}</strong>
                    </div>

                </div>

            </div>


            {/* =====================================================
                ERROR
            ===================================================== */}

            {error && (
                <div className="error-banner document-error">

                    <span>!</span>

                    {error}

                </div>
            )}


            {/* =====================================================
                UPLOAD
            ===================================================== */}

            {canUpload && (

                <section className="document-upload-card">

                    <div className="section-heading">

                        <div className="section-heading-icon">
                            ↑
                        </div>

                        <div>

                            <h2>
                                Add knowledge document
                            </h2>

                            <p>
                                Upload a laboratory procedure or safety reference.
                            </p>

                        </div>

                    </div>


                    <form
                        onSubmit={handleUpload}
                        className="document-upload-form"
                    >

                        <div className="field document-title-field">

                            <label>
                                Document title
                            </label>

                            <input
                                value={title}
                                onChange={e =>
                                    setTitle(e.target.value)
                                }
                                placeholder="e.g. Fume Hood Safety Procedure"
                            />

                        </div>


                        <div className="field document-file-field">

                            <label>
                                Document file
                            </label>

                            <label className="file-drop-zone">

                                <input
                                    type="file"
                                    accept=".txt,.pdf"
                                    onChange={e =>
                                        setFile(e.target.files[0])
                                    }
                                />

                                <span className="file-drop-icon">
                                    ↑
                                </span>

                                <span className="file-drop-main">

                                    {file
                                        ? file.name
                                        : 'Choose a .txt or .pdf file'}

                                </span>

                                <span className="file-drop-hint">

                                    {file
                                        ? `${(file.size / 1024).toFixed(1)} KB selected`
                                        : 'Click to browse files'}

                                </span>

                            </label>

                        </div>


                        <button
                            className="btn btn-primary document-upload-button"
                            disabled={uploading}
                            type="submit"
                        >

                            <span>

                                {uploading
                                    ? 'Uploading & indexing…'
                                    : canApprove
                                        ? 'Upload & approve'
                                        : 'Submit for approval'}

                            </span>

                            {!uploading && (
                                <span className="button-arrow">
                                    →
                                </span>
                            )}

                        </button>

                    </form>


                    <div className="upload-note">

                        <span>ⓘ</span>

                        <span>
                            Supported formats:
                            <strong>.TXT</strong> and
                            <strong> .PDF</strong>.
                            Documents are indexed into the laboratory
                            knowledge base.
                        </span>

                    </div>

                </section>

            )}


            {/* =====================================================
                DOCUMENT LIST
            ===================================================== */}

            <section className="documents-section">

                <div className="documents-section-header">

                    <div>

                        <div className="eyebrow">
                            REFERENCE LIBRARY
                        </div>

                        <h2>
                            Uploaded documents
                        </h2>

                    </div>

                    <div className="document-count-pill">

                        {docs.length} document
                        {docs.length !== 1 ? 's' : ''}

                    </div>

                </div>


                {docs.length === 0 ? (

                    <div className="document-empty">

                        <div className="document-empty-icon">
                            ▤
                        </div>

                        <h3>
                            No documents yet
                        </h3>

                        <p>
                            Upload your first approved laboratory reference
                            document to start building the knowledge base.
                        </p>

                    </div>

                ) : (

                    <div className="document-list">

                        {docs.map(d => (

                            <article
                                key={d.id}
                                className="document-card"
                            >

                                {/* =================================================
                                    DOCUMENT INFORMATION
                                ================================================= */}

                                <div className="document-card-main">

                                    <div className="document-file-icon">

                                        {d.fileName
                                            ?.toLowerCase()
                                            .endsWith('.pdf')
                                            ? 'PDF'
                                            : 'TXT'}

                                    </div>


                                    <div className="document-information">

                                        <div className="document-title-row">

                                            <h3>
                                                {d.title}
                                            </h3>

                                            <DocStatusBadge
                                                status={d.status}
                                            />

                                        </div>


                                        <div className="document-file-name">
                                            {d.fileName}
                                        </div>


                                        <div className="document-meta">

                                            <span>

                                                <strong>
                                                    {d.chunkCount}
                                                </strong>{' '}
                                                indexed chunks

                                            </span>

                                            <span className="meta-separator">
                                                •
                                            </span>

                                            <span>

                                                Uploaded by{' '}

                                                <strong>
                                                    {d.uploadedByName}
                                                </strong>

                                            </span>

                                        </div>


                                        {d.reviewedByName && (

                                            <div className="document-review">

                                                <span className="review-check">
                                                    ✓
                                                </span>

                                                Reviewed by{' '}

                                                <strong>
                                                    {d.reviewedByName}
                                                </strong>

                                                {' '}on{' '}

                                                {new Date(
                                                    d.reviewedAtUtc
                                                ).toLocaleDateString()}

                                            </div>

                                        )}

                                    </div>

                                </div>


                                {/* =================================================
                                    ACTIONS
                                ================================================= */}

                                <div className="document-actions">

                                    {/* VIEW — ADMIN ONLY */}

                                    {canDelete && (

                                        <button
                                            type="button"
                                            className="btn document-action-view"
                                            onClick={() =>
                                                viewDocument(d)
                                            }
                                            disabled={loadingDocument}
                                        >

                                            <span>👁</span>

                                            View

                                        </button>

                                    )}


                                    {/* APPROVE / REJECT — ADMIN ONLY */}

                                    {canApprove &&
                                        d.status === 'Pending' && (

                                            <>

                                                <button
                                                    type="button"
                                                    className="btn btn-primary document-action-approve"
                                                    onClick={() =>
                                                        approve(d.id)
                                                    }
                                                >

                                                    <span>✓</span>

                                                    Approve

                                                </button>


                                                <button
                                                    type="button"
                                                    className="btn btn-danger document-action-reject"
                                                    onClick={() =>
                                                        reject(d.id)
                                                    }
                                                >

                                                    <span>×</span>

                                                    Reject

                                                </button>

                                            </>

                                        )}


                                    {/* DELETE — ADMIN ONLY */}

                                    {canDelete && (

                                        <button
                                            type="button"
                                            className="btn document-action-delete"
                                            onClick={() =>
                                                deleteDocument(
                                                    d.id,
                                                    d.title
                                                )
                                            }
                                        >

                                            <span>×</span>

                                            Delete

                                        </button>

                                    )}

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>


            {/* =====================================================
                ORIGINAL DOCUMENT PREVIEW MODAL
            ===================================================== */}

            {viewingDocument && (

                <div
                    className="document-preview-overlay"
                    onClick={closeDocumentPreview}
                >

                    <div
                        className="document-preview-modal"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        {/* =================================================
                            PREVIEW HEADER
                        ================================================= */}

                        <div className="document-preview-header">

                            <div>

                                <div className="eyebrow">
                                    DOCUMENT PREVIEW
                                </div>

                                <h2>
                                    {viewingDocument.title}
                                </h2>

                                <div className="document-preview-file">
                                    {viewingDocument.fileName}
                                </div>

                            </div>


                            <button
                                type="button"
                                className="document-preview-close"
                                onClick={closeDocumentPreview}
                                aria-label="Close document preview"
                            >
                                ×
                            </button>

                        </div>


                        {/* =================================================
                            PREVIEW META
                        ================================================= */}

                        <div className="document-preview-meta">

                            <DocStatusBadge
                                status={viewingDocument.status}
                            />

                            <span>

                                Uploaded by{' '}

                                <strong>
                                    {viewingDocument.uploadedByName}
                                </strong>

                            </span>

                            <span>

                                {new Date(
                                    viewingDocument.uploadedAtUtc
                                ).toLocaleString([], {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}

                            </span>

                        </div>


                        {/* =================================================
                            ORIGINAL FILE VIEWER
                        ================================================= */}

                        <div className="document-preview-content">

                            {viewingDocument.fileName
                                ?.toLowerCase()
                                .endsWith('.pdf') ? (

                                <iframe
                                    src={viewingDocument.fileUrl}
                                    title={viewingDocument.title}
                                    className="document-pdf-viewer"
                                />

                            ) : (

                                <iframe
                                    src={viewingDocument.fileUrl}
                                    title={viewingDocument.title}
                                    className="document-pdf-viewer"
                                />

                            )}

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="document-preview-footer">

                            <span>
                                Original uploaded document
                            </span>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeDocumentPreview}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                FOOTER INFORMATION
            ===================================================== */}

            <div className="knowledge-footer">

                <div className="knowledge-footer-icon">
                    ✦
                </div>

                <div>

                    <strong>
                        Why approved documents matter
                    </strong>

                    <p>
                        LabTrack uses vetted documents as the source of
                        truth for its AI assistant. This helps keep answers
                        focused on your laboratory's approved procedures
                        rather than relying on unverified information.
                    </p>

                </div>

            </div>

        </div>
    )
}