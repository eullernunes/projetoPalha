import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Roles from './pages/Roles'
import Production from './pages/Production'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'

function RequireAuth() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index                element={<Dashboard />} />
          <Route path="funcionarios"  element={<Employees />} />
          <Route path="funcoes"       element={<Roles />} />
          <Route path="producao"      element={<Production />} />
          <Route path="despesas"      element={<Expenses />} />
          <Route path="relatorios"    element={<Reports />} />
        </Route>
      </Route>
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
