import { createContext, useContext, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

// Wraps the whole app so any component can ask "who is logged in?" and
// "log in / log out" without passing props down through every layer.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('labtrack_user')
    return saved ? JSON.parse(saved) : null
  })

  async function login(email, password) {
    const result = await api.post('/auth/login', { email, password })
    persistSession(result)
  }

  async function register(fullName, email, password) {
    const result = await api.post('/auth/register', { fullName, email, password })
    persistSession(result)
  }

  function persistSession(result) {
    localStorage.setItem('labtrack_token', result.token)
    const userInfo = { fullName: result.fullName, email: result.email, role: result.role }
    localStorage.setItem('labtrack_user', JSON.stringify(userInfo))
    setUser(userInfo)
  }

  function logout() {
    localStorage.removeItem('labtrack_token')
    localStorage.removeItem('labtrack_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
