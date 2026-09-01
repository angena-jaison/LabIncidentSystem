import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const [mode, setMode] = useState('login')
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
            if (mode === 'login') {
                await login(email, password)
            } else {
                await register(fullName, email, password)
            }

            navigate('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const isLogin = mode === 'login'

    return (
        <div
            className="login-layout"
            style={{
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                background: '#f7fafc',
            }}
        >

            {/* =====================================================
          LEFT PANEL
          ===================================================== */}

            <div
                style={{
                    position: 'relative',
                    overflow: 'hidden',

                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',

                    padding: '70px',

                    color: '#ffffff',

                    background:
                        'linear-gradient(145deg, #0f766e 0%, #115e59 55%, #102a43 100%)',
                }}
            >

                {/* Decorative circles */}

                <div
                    style={{
                        position: 'absolute',
                        width: 380,
                        height: 380,
                        borderRadius: '50%',

                        background: 'rgba(255,255,255,0.06)',

                        top: -140,
                        right: -120,
                    }}
                />

                <div
                    style={{
                        position: 'absolute',
                        width: 260,
                        height: 260,
                        borderRadius: '50%',

                        background: 'rgba(20,184,166,0.18)',

                        bottom: -100,
                        left: -80,
                    }}
                />

                <div
                    style={{
                        position: 'relative',
                        maxWidth: 560,
                    }}
                >

                    {/* Brand */}

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            marginBottom: 45,
                        }}
                    >

                        <div
                            style={{
                                width: 52,
                                height: 52,

                                display: 'grid',
                                placeItems: 'center',

                                borderRadius: 16,

                                background: 'rgba(255,255,255,0.14)',

                                fontSize: 25,
                            }}
                        >
                            🧪
                        </div>

                        <div>
                            <div
                                style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                }}
                            >
                                LabTrack
                            </div>

                            <div
                                style={{
                                    fontSize: 11,
                                    letterSpacing: '0.12em',
                                    opacity: 0.7,
                                }}
                            >
                                LAB SAFETY PLATFORM
                            </div>
                        </div>

                    </div>


                    {/* Main heading */}

                    <div
                        style={{
                            fontSize: 52,
                            lineHeight: 1.08,
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            marginBottom: 22,
                        }}
                    >
                        Safer labs.
                        <br />
                        Smarter incidents.
                    </div>

                    <p
                        style={{
                            color: 'rgba(255,255,255,0.78)',
                            fontSize: 17,
                            lineHeight: 1.7,
                            maxWidth: 500,
                            marginBottom: 38,
                        }}
                    >
                        Track laboratory incidents, investigate risks,
                        and use AI-powered knowledge to make your
                        laboratory safer.
                    </p>


                    {/* Feature cards */}

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 12,
                        }}
                    >

                        <Feature
                            icon="⚠️"
                            title="Report"
                            text="Log incidents quickly"
                        />

                        <Feature
                            icon="🔎"
                            title="Investigate"
                            text="Track every detail"
                        />

                        <Feature
                            icon="✦"
                            title="Learn"
                            text="AI safety guidance"
                        />

                    </div>

                </div>
            </div>


            {/* =====================================================
          RIGHT PANEL
          ===================================================== */}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    padding: 35,
                }}
            >

                <div
                    style={{
                        width: '100%',
                        maxWidth: 440,

                        padding: 38,

                        borderRadius: 24,

                        background: '#ffffff',

                        border: '1px solid #e2e8f0',

                        boxShadow:
                            '0 20px 60px rgba(15,23,42,0.09)',
                    }}
                >

                    {/* Header */}

                    <div style={{ marginBottom: 28 }}>

                        <div
                            style={{
                                display: 'inline-flex',
                                padding: '6px 10px',

                                borderRadius: 999,

                                color: 'var(--color-primary)',

                                background: 'var(--color-surface-soft)',

                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                            }}
                        >
                            {isLogin ? 'WELCOME BACK' : 'GET STARTED'}
                        </div>

                        <h1
                            style={{
                                marginTop: 15,
                                marginBottom: 8,
                                fontSize: 30,
                            }}
                        >
                            {isLogin
                                ? 'Welcome back 👋'
                                : 'Create your account'}
                        </h1>

                        <p
                            style={{
                                color: 'var(--color-text-muted)',
                                fontSize: 14,
                            }}
                        >
                            {isLogin
                                ? 'Sign in to continue to your laboratory dashboard.'
                                : 'Create an account to start managing laboratory incidents.'}
                        </p>

                    </div>


                    {/* Error */}

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}


                    {/* Form */}

                    <form onSubmit={handleSubmit}>

                        {!isLogin && (
                            <div className="field">

                                <label>Full name</label>

                                <input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                />

                            </div>
                        )}


                        <div className="field">

                            <label>Email address</label>

                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />

                        </div>


                        <div className="field">

                            <label>Password</label>

                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />

                        </div>


                        <button
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                minHeight: 48,
                                marginTop: 5,
                                fontSize: 14,
                            }}
                            disabled={loading}
                        >
                            {loading
                                ? 'Please wait…'
                                : isLogin
                                    ? 'Sign in to LabTrack →'
                                    : 'Create account →'}
                        </button>

                    </form>


                    {/* Switch login/register */}

                    <div
                        style={{
                            marginTop: 22,

                            paddingTop: 20,

                            borderTop:
                                '1px solid var(--color-border-light)',

                            textAlign: 'center',

                            fontSize: 13,
                            color: 'var(--color-text-muted)',
                        }}
                    >

                        {isLogin ? (
                            <>
                                Don't have an account?{' '}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError('')
                                        setMode('register')
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        padding: 0,

                                        color: 'var(--color-primary)',

                                        fontWeight: 700,
                                    }}
                                >
                                    Create one
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError('')
                                        setMode('login')
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        padding: 0,

                                        color: 'var(--color-primary)',

                                        fontWeight: 700,
                                    }}
                                >
                                    Sign in
                                </button>
                            </>
                        )}

                    </div>




                </div>

            </div>


            {/* =====================================================
          MOBILE RESPONSIVE
          ===================================================== */}

            <style>{`
        @media (max-width: 850px) {
          .login-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

        </div>
    )
}


/* =========================================================
   FEATURE CARD
   ========================================================= */

function Feature({ icon, title, text }) {
    return (
        <div
            style={{
                padding: 15,

                borderRadius: 14,

                background: 'rgba(255,255,255,0.09)',

                border:
                    '1px solid rgba(255,255,255,0.10)',
            }}
        >

            <div
                style={{
                    fontSize: 19,
                    marginBottom: 8,
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 3,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.65)',
                    lineHeight: 1.4,
                }}
            >
                {text}
            </div>

        </div>
    )
}