import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'

const ROLES = ['LabUser', 'Reviewer', 'Administrator']

export default function AdminUsersPage() {
    const { user } = useAuth()

    const [users, setUsers] = useState([])
    const [error, setError] = useState('')
    const [tempPasswords, setTempPasswords] = useState({})

    // Search/filter state
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    function reload(searchValue = search, statusValue = statusFilter) {
        setError('')

        const params = new URLSearchParams()

        if (searchValue.trim()) {
            params.set('search', searchValue.trim())
        }

        if (statusValue === 'active') {
            params.set('isActive', 'true')
        }

        if (statusValue === 'inactive') {
            params.set('isActive', 'false')
        }

        const queryString = params.toString()

        api.get(`/admin/users${queryString ? `?${queryString}` : ''}`)
            .then(setUsers)
            .catch(err => setError(err.message))
    }

    // Load all users when page opens
    useEffect(() => {
        reload('', 'all')
    }, [])

    if (user?.role !== 'Administrator') {
        return (
            <div className="app-shell">
                <div className="error-banner">
                    This page is only available to Administrators.
                </div>
            </div>
        )
    }

    // SEARCH BUTTON
    function handleSearch(e) {
        e.preventDefault()

        setSearch(searchInput)

        reload(searchInput, statusFilter)
    }

    // CLEAR SEARCH
    function handleClear() {
        setSearchInput('')
        setSearch('')

        reload('', statusFilter)
    }

    // STATUS FILTER
    function handleStatusChange(e) {
        const newStatus = e.target.value

        setStatusFilter(newStatus)

        // Use the already submitted search value
        reload(search, newStatus)
    }

    async function changeRole(id, newRole) {
        setError('')

        try {
            await api.patch(`/admin/users/${id}/role`, { newRole })

            // Refresh using current search/filter
            reload()
        } catch (err) {
            setError(err.message)
        }
    }

    async function toggleActive(id, isActive) {
        setError('')

        try {
            await api.patch(`/admin/users/${id}/active`, { isActive })

            // Refresh using current search/filter
            reload()
        } catch (err) {
            setError(err.message)
        }
    }

    async function resetPassword(id) {
        setError('')

        try {
            const result = await api.post(
                `/admin/users/${id}/reset-password`
            )

            setTempPasswords(prev => ({
                ...prev,
                [id]: result.temporaryPassword
            }))
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">

            {/* PAGE HEADER */}
            <div className="admin-header">
                <div>
                    <h1>Manage accounts</h1>

                    <p>
                        Administrator-only: set roles, deactivate accounts,
                        and issue temporary passwords.
                    </p>
                </div>

                <div className="admin-count">
                    {users.length} accounts
                </div>
            </div>

            {error && (
                <div className="error-banner admin-error">
                    {error}
                </div>
            )}

            {/* SEARCH + FILTER */}
            <form
                className="admin-user-filters"
                onSubmit={handleSearch}
            >

                {/* SEARCH BOX */}
                <div className="admin-search-box">

                    <input
                        type="text"
                        placeholder="Search users by name..."
                        value={searchInput}
                        onChange={e =>
                            setSearchInput(e.target.value)
                        }
                    />

                </div>

                {/* SEARCH BUTTON */}
                <button
                    type="submit"
                    className="admin-search-btn"
                >
                    Search
                </button>

                {/* CLEAR BUTTON */}
                {(searchInput || search) && (
                    <button
                        type="button"
                        className="admin-clear-btn"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                )}

                {/* STATUS FILTER */}
                <div className="admin-status-filter">

                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                    >
                        <option value="all">
                            All users
                        </option>

                        <option value="active">
                            Activated
                        </option>

                        <option value="inactive">
                            Deactivated
                        </option>
                    </select>

                </div>

            </form>

            {/* TABLE HEADER */}
            <div className="admin-table-header">
                <div>User</div>
                <div>Role</div>
                <div>Actions</div>
            </div>

            {/* USERS */}
            <div className="admin-users">

                {users.length === 0 ? (

                    <div className="admin-empty">
                        No users found.
                    </div>

                ) : (

                    users.map(u => {

                        const isSelf = u.email === user.email

                        return (
                            <div
                                key={u.id}
                                className={`admin-user-row ${!u.isActive ? 'inactive' : ''}`}
                            >

                                {/* USER INFO */}
                                <div className="admin-user-info">

                                    <div className="admin-avatar">
                                        {u.fullName?.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="admin-user-details">

                                        <div className="admin-user-name">

                                            {u.fullName}

                                            {isSelf && (
                                                <span className="you-badge">
                                                    You
                                                </span>
                                            )}

                                            {!u.isActive && (
                                                <span className="deactivated-badge">
                                                    Deactivated
                                                </span>
                                            )}

                                        </div>

                                        <div className="admin-user-email">
                                            {u.email}
                                        </div>

                                        {tempPasswords[u.id] && (
                                            <div className="temporary-password">
                                                Temporary password:
                                                <strong>
                                                    {tempPasswords[u.id]}
                                                </strong>
                                            </div>
                                        )}

                                    </div>

                                </div>

                                {/* ROLE */}
                                <div className="admin-role">

                                    <label>Role</label>

                                    <select
                                        value={u.role}
                                        onChange={e =>
                                            changeRole(
                                                u.id,
                                                e.target.value
                                            )
                                        }
                                        disabled={isSelf}
                                        title={
                                            isSelf
                                                ? "You can't change your own role"
                                                : undefined
                                        }
                                    >

                                        {ROLES.map(role => (
                                            <option
                                                key={role}
                                                value={role}
                                            >
                                                {role}
                                            </option>
                                        ))}

                                    </select>

                                </div>

                                {/* ACTIONS */}
                                <div className="admin-actions">

                                    <button
                                        className="admin-reset-btn"
                                        onClick={() =>
                                            resetPassword(u.id)
                                        }
                                    >
                                        Reset password
                                    </button>

                                    {isSelf ? (

                                        <button
                                            className="admin-disabled-btn"
                                            disabled
                                            title="You can't deactivate your own account"
                                        >
                                            Deactivate
                                        </button>

                                    ) : u.isActive ? (

                                        <button
                                            className="admin-deactivate-btn"
                                            onClick={() =>
                                                toggleActive(
                                                    u.id,
                                                    false
                                                )
                                            }
                                        >
                                            Deactivate
                                        </button>

                                    ) : (

                                        <button
                                            className="admin-reactivate-btn"
                                            onClick={() =>
                                                toggleActive(
                                                    u.id,
                                                    true
                                                )
                                            }
                                        >
                                            Reactivate
                                        </button>

                                    )}

                                </div>

                            </div>
                        )
                    })

                )}

            </div>

        </div>
    )
}