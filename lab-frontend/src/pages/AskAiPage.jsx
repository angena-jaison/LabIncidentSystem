import { useState } from 'react'
import { api } from '../api/client'
import '../styles/askai.css'

export default function AskAiPage() {
    const [question, setQuestion] = useState('')
    const [history, setHistory] = useState([])
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
            const response = await api.post('/ai/ask', {
                question: askedQuestion
            })

            setHistory(prev => [
                {
                    question: askedQuestion,
                    response
                },
                ...prev
            ])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function useSuggestion(text) {
        setQuestion(text)
    }

    return (
        <div className="app-shell ask-ai-page">

            {/* =====================================================
          HEADER
          ===================================================== */}

            <div className="ai-page-header">

                <div className="ai-header-content">

                    <div className="ai-eyebrow">
                        LABTRACK INTELLIGENCE
                    </div>

                    <h1>
                        Ask the AI assistant
                    </h1>

                    <p>
                        Get answers grounded in your laboratory's
                        approved knowledge base.
                    </p>

                </div>


                <div className="ai-header-orb">
                    <div className="ai-orb-inner">
                        ✦
                    </div>
                </div>

            </div>


            {/* =====================================================
          TRUST BANNER
          ===================================================== */}

            <div className="ai-trust-banner">

                <div className="ai-trust-icon">
                    ✓
                </div>

                <div>

                    <strong>
                        Grounded AI responses
                    </strong>

                    <p>
                        The assistant uses approved knowledge-base documents
                        instead of relying on the open internet or guessing.
                    </p>

                </div>

                <div className="ai-trust-status">
                    Knowledge base only
                </div>

            </div>


            {/* =====================================================
          ASK BOX
          ===================================================== */}

            <section className="ai-question-card">

                <div className="ai-question-heading">

                    <div className="ai-question-icon">
                        ?
                    </div>

                    <div>
                        <h2>
                            What can I help you with?
                        </h2>

                        <p>
                            Ask about laboratory procedures, incidents,
                            equipment or safety practices.
                        </p>
                    </div>

                </div>


                <form
                    onSubmit={handleAsk}
                    className="ai-question-form"
                >

                    <div className="ai-input-wrapper">

                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder="e.g. What should I do if a centrifuge overheats?"
                            rows={3}
                            disabled={loading}
                        />

                        <div className="ai-input-footer">

                            <span>
                                {question.length > 0
                                    ? `${question.length} characters`
                                    : 'Ask a clear, specific question'}
                            </span>

                            <button
                                className="btn btn-primary ai-ask-button"
                                disabled={loading || !question.trim()}
                                type="submit"
                            >

                                {loading ? (
                                    <>
                                        <span className="ai-spinner" />
                                        Thinking…
                                    </>
                                ) : (
                                    <>
                                        Ask AI
                                        <span className="ai-send-arrow">
                                            →
                                        </span>
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </form>


                {/* =================================================
            SUGGESTIONS
            ================================================= */}

                <div className="ai-suggestions">

                    <span className="ai-suggestions-label">
                        Try asking
                    </span>

                    <div className="ai-suggestion-list">

                        <button
                            type="button"
                            onClick={() =>
                                useSuggestion(
                                    'What should I do if a centrifuge overheats?'
                                )
                            }
                        >
                            Centrifuge overheating
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                useSuggestion(
                                    'What should I do during a chemical spill in the fume hood?'
                                )
                            }
                        >
                            Chemical spill
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                useSuggestion(
                                    'What are the recommended laboratory safety procedures?'
                                )
                            }
                        >
                            Lab safety procedures
                        </button>

                    </div>

                </div>

            </section>


            {/* =====================================================
          ERROR
          ===================================================== */}

            {error && (

                <div className="ai-error">

                    <div className="ai-error-icon">
                        !
                    </div>

                    <div>
                        <strong>
                            Unable to get an answer
                        </strong>

                        <p>
                            {error}
                        </p>
                    </div>

                </div>

            )}


            {/* =====================================================
          ANSWERS
          ===================================================== */}

            {history.length > 0 && (

                <section className="ai-history">

                    <div className="ai-history-header">

                        <div>
                            <div className="ai-eyebrow">
                                CONVERSATION
                            </div>

                            <h2>
                                Previous answers
                            </h2>
                        </div>

                        <span className="ai-history-count">
                            {history.length}
                            {history.length === 1 ? ' question' : ' questions'}
                        </span>

                    </div>


                    <div className="ai-answer-list">

                        {history.map((entry, i) => (

                            <article
                                key={i}
                                className="ai-answer-card"
                            >

                                {/* QUESTION */}

                                <div className="ai-question-row">

                                    <div className="ai-avatar user-avatar">
                                        You
                                    </div>

                                    <div className="ai-question-text">
                                        {entry.question}
                                    </div>

                                </div>


                                {/* ANSWER */}

                                <div className="ai-response-row">

                                    <div className="ai-avatar ai-avatar-main">
                                        ✦
                                    </div>

                                    <div className="ai-response-content">

                                        <div className="ai-response-header">

                                            <strong>
                                                LabTrack AI
                                            </strong>

                                            {entry.response.isGrounded ? (
                                                <span className="grounded-badge">
                                                    ✓ Grounded
                                                </span>
                                            ) : (
                                                <span className="ungrounded-badge">
                                                    ⚠ Not grounded
                                                </span>
                                            )}

                                        </div>


                                        {/* WARNING */}

                                        {!entry.response.isGrounded && (

                                            <div className="ai-grounding-warning">

                                                <span>
                                                    ⚠
                                                </span>

                                                <div>
                                                    <strong>
                                                        Not grounded in the knowledge base
                                                    </strong>

                                                    <p>
                                                        Treat this answer with caution because
                                                        no sufficiently relevant approved source
                                                        was found.
                                                    </p>
                                                </div>

                                            </div>

                                        )}


                                        {/* ANSWER */}

                                        <div className="ai-answer-text">
                                            {entry.response.answer
                                                .split(/\r?\n/)
                                                .map(line => line.trim())
                                                .filter(line => line.length > 0)
                                                .map((line, k) => {

                                                    const isBullet =
                                                        line.startsWith('-') ||
                                                        line.startsWith('•') ||
                                                        line.startsWith('*')

                                                    const cleanLine = line.replace(/^[-•*]\s*/, '')

                                                    return isBullet ? (
                                                        <div key={k} className="ai-answer-bullet">
                                                            <span className="bullet-dot">•</span>
                                                            <span>{cleanLine}</span>
                                                        </div>
                                                    ) : (
                                                        <div key={k} className="ai-answer-paragraph">
                                                            {cleanLine}
                                                        </div>
                                                    )
                                                })}
                                        </div>


                                        {/* SOURCES */}

                                        {entry.response.sources?.length > 0 && (

                                            <details className="ai-sources">

                                                <summary>
                                                    <span className="source-icon">
                                                        ◫
                                                    </span>

                                                    <span>
                                                        {entry.response.sources.length}
                                                        {' '}
                                                        {entry.response.sources.length === 1
                                                            ? 'source'
                                                            : 'sources'}
                                                        {' '}used
                                                    </span>

                                                    <span className="source-chevron">
                                                        ▾
                                                    </span>
                                                </summary>


                                                <div className="source-list">

                                                    {entry.response.sources.map((s, j) => (

                                                        <div
                                                            key={j}
                                                            className="source-item"
                                                        >

                                                            <div className="source-number">
                                                                {j + 1}
                                                            </div>

                                                            <div className="source-content">

                                                                <strong>
                                                                    {s.documentTitle}
                                                                </strong>

                                                                <div className="source-meta">
                                                                    Chunk {s.chunkIndex}
                                                                    {' · '}
                                                                    similarity {s.similarityScore}
                                                                </div>

                                                                <p>
                                                                    {s.snippet}
                                                                </p>

                                                            </div>

                                                        </div>

                                                    ))}

                                                </div>

                                            </details>

                                        )}

                                    </div>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>

            )}


            {/* =====================================================
          EMPTY STATE
          ===================================================== */}

            {history.length === 0 && (

                <div className="ai-empty-state">

                    <div className="ai-empty-icon">
                        ✦
                    </div>

                    <h3>
                        Your laboratory AI assistant
                    </h3>

                    <p>
                        Ask a question above and your answer will be
                        generated using the approved knowledge base.
                    </p>

                </div>

            )}

        </div>
    )
}