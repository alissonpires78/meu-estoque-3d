import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './pages/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { Printers } from './pages/Printers'
import { Filaments } from './pages/Filaments'
import { FilamentScan } from './pages/FilamentScan'
import { Calculator } from './pages/Calculator'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, canRead } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="printers" element={<Printers />} />
        <Route path="filaments" element={<Filaments />} />
        <Route path="calculator" element={<Calculator />} />
      </Route>
      <Route
        path="/filaments/scan"
        element={
          <PrivateRoute>
            <FilamentScan />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
