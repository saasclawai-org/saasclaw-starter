import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { ProjectView } from './pages/ProjectView'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Account } from './pages/Account'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/:slug" element={<ProjectView />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}