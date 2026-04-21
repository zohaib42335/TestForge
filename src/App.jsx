import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import { ProjectProvider } from './context/ProjectContext.jsx'
import useProject from './hooks/useProject.js'
import Navbar from './components/Navbar.jsx'
import UsageBanner from './components/UsageBanner.jsx'
import TeamPage from './pages/TeamPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import BillingSuccessPage from './pages/BillingSuccessPage.jsx'
import PlanLimitModal from './components/PlanLimitModal.jsx'
import usePlanLimits from './hooks/usePlanLimits.js'
import Dashboard from './components/Dashboard.jsx'
import ReportsPage from './pages/ReportsPage.jsx'

function RolePermissionsMatrix() {
  const rows = [
    {
      permission: 'Create projects',
      ADMIN: true,
      QA_MANAGER: true,
      TESTER: false,
      VIEWER: false,
    },
    {
      permission: 'Update project details',
      ADMIN: true,
      QA_MANAGER: true,
      TESTER: false,
      VIEWER: false,
    },
    {
      permission: 'Archive projects',
      ADMIN: true,
      QA_MANAGER: false,
      TESTER: false,
      VIEWER: false,
    },
    {
      permission: 'Invite and manage team members',
      ADMIN: true,
      QA_MANAGER: false,
      TESTER: false,
      VIEWER: false,
    },
    {
      permission: 'Access billing',
      ADMIN: true,
      QA_MANAGER: false,
      TESTER: false,
      VIEWER: false,
    },
    {
      permission: 'View reports',
      ADMIN: true,
      QA_MANAGER: true,
      TESTER: false,
      VIEWER: true,
    },
    {
      permission: 'Work on assigned test cases and runs',
      ADMIN: true,
      QA_MANAGER: true,
      TESTER: true,
      VIEWER: false,
    },
  ]

  const renderCell = (value) => (
    <span className={value ? 'font-semibold text-green-700' : 'text-[#6B7FA6]'}>
      {value ? 'Yes' : 'No'}
    </span>
  )

  return (
    <div className="mt-6 rounded-xl border border-[#D7E2F5] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1A3263]">Role Permissions Matrix</h2>
      <p className="mt-1 text-sm text-[#4D628C]">
        Quick overview of what each role can do in this workspace.
      </p>
      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[#53698F]">
            <tr>
              <th className="py-2 pr-3">Permission</th>
              <th className="py-2 pr-3">Admin</th>
              <th className="py-2 pr-3">QA Manager</th>
              <th className="py-2 pr-3">Tester</th>
              <th className="py-2 pr-3">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.permission} className="border-t border-[#EEF2FB]">
                <td className="py-2 pr-3 text-[#1A3263]">{row.permission}</td>
                <td className="py-2 pr-3">{renderCell(row.ADMIN)}</td>
                <td className="py-2 pr-3">{renderCell(row.QA_MANAGER)}</td>
                <td className="py-2 pr-3">{renderCell(row.TESTER)}</td>
                <td className="py-2 pr-3">{renderCell(row.VIEWER)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-[#1A3263]">Dashboard</h1>
      <Dashboard />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2FB] text-[#1A3263]">
        Checking session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function AppShell({ children }) {
  const navigate = useNavigate()
  const { usage } = usePlanLimits()
  const [planModal, setPlanModal] = useState({ open: false, limitType: 'projects' })

  useEffect(() => {
    const onPlanLimit = (event) => {
      const message = String(event?.detail?.message || '').toLowerCase()
      const limitType = message.includes('user')
        ? 'users'
        : message.includes('test')
          ? 'testCases'
          : 'projects'
      setPlanModal({ open: true, limitType })
    }
    window.addEventListener('plan-limit-reached', onPlanLimit)
    return () => window.removeEventListener('plan-limit-reached', onPlanLimit)
  }, [])

  return (
    <div className="min-h-screen bg-[#EEF2FB]">
      <Navbar />
      <UsageBanner onUpgrade={() => navigate('/billing')} />
      <PlanLimitModal
        open={planModal.open}
        onClose={() => setPlanModal((p) => ({ ...p, open: false }))}
        limitType={planModal.limitType}
        used={usage?.[planModal.limitType]?.used || 0}
        max={usage?.[planModal.limitType]?.max || 0}
      />
      {children}
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, currentUser } = useAuth()
  const { projects, loading } = useProject()
  const canCreateProjects = ['ADMIN', 'QA_MANAGER'].includes(currentUser?.role || '')
  const canAccessReports = ['ADMIN', 'QA_MANAGER', 'VIEWER'].includes(currentUser?.role || '')

    return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route
        path="/onboarding"
        element={(
          <ProtectedRoute>
            <AppShell>
              {canCreateProjects ? <OnboardingPage /> : <Navigate to="/dashboard" replace />}
            </AppShell>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <AppShell>
              {!loading && projects.length === 0 && canCreateProjects ? (
                <Navigate to="/onboarding" replace />
              ) : (
                <DashboardPage />
              )}
            </AppShell>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/team"
        element={(
          <ProtectedRoute>
            <AppShell>
              <TeamPage />
            </AppShell>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/reports"
        element={(
          <ProtectedRoute>
            <AppShell>
              {canAccessReports ? (
                <div className="mx-auto w-full max-w-7xl px-4 py-6">
                  <h1 className="mb-4 text-2xl font-semibold text-[#1A3263]">Reports</h1>
                  <ReportsPage />
                </div>
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </AppShell>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/billing/success"
        element={(
          <ProtectedRoute>
            <BillingSuccessPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/billing"
        element={(
          <ProtectedRoute>
            <AppShell>
              <BillingPage />
            </AppShell>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/settings"
        element={(
          <ProtectedRoute>
            <AppShell>
              <div className="mx-auto w-full max-w-7xl px-4 py-6">
                <div className="rounded-xl border border-[#D7E2F5] bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-semibold text-[#1A3263]">Settings</h1>
                  <p className="mt-2 text-sm text-[#4D628C]">
                    Manage workspace behavior and review role capabilities.
                  </p>
                </div>
                <RolePermissionsMatrix />
              </div>
            </AppShell>
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  )
}
