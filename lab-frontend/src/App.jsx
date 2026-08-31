import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import IncidentsListPage from './pages/IncidentsListPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import NewIncidentPage from './pages/NewIncidentPage'
import DocumentsPage from './pages/DocumentsPage'
import AskAiPage from './pages/AskAiPage'
import AdminUsersPage from './pages/AdminUsersPage'

// Small helper so every protected page automatically gets the Navbar too,
// without repeating <Navbar/> in each page file.
function Layout({ children }) {
  return (
    <ProtectedRoute>
      <Navbar />
      {children}
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout><DashboardPage /></Layout>} />
          <Route path="/incidents" element={<Layout><IncidentsListPage /></Layout>} />
          <Route path="/incidents/new" element={<Layout><NewIncidentPage /></Layout>} />
          <Route path="/incidents/:id" element={<Layout><IncidentDetailPage /></Layout>} />
          <Route path="/documents" element={<Layout><DocumentsPage /></Layout>} />
          <Route path="/ask-ai" element={<Layout><AskAiPage /></Layout>} />
          <Route path="/admin/users" element={<Layout><AdminUsersPage /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
