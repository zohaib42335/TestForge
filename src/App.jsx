import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import { ProjectProvider } from './context/ProjectContext.jsx'
import useProject from './hooks/useProject.js'
import TeamPage from './pages/TeamPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import BillingSuccessPage from './pages/BillingSuccessPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import { ToastProvider } from './components/Toast.jsx'
import ForbiddenPage from './pages/ForbiddenPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import TestCasesPage from './pages/TestCasesPage.jsx'
import TestRunsPage from './pages/TestRunsPage.jsx'
import ExecutionMode from './components/TestRuns/ExecutionMode.jsx'
import TestCaseFormPage from './pages/TestCaseFormPage.jsx'
import TestCaseDetailPage from './pages/TestCaseDetailPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-[#1A3263]">Dashboard</h1>
      <Dashboard />
    </div>
  )
}

function ProfilePage() {
  const { currentUser } = useAuth()
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-[#1A3263]">Profile</h1>
      <div className="mt-4 rounded-xl border border-[#D7E2F5] bg-white p-5">
        <p className="text-sm text-[#5A6E9A]">Name</p>
        <p className="text-base font-medium text-[#1A3263]">{currentUser?.displayName || 'User'}</p>
        <p className="mt-3 text-sm text-[#5A6E9A]">Email</p>
        <p className="text-base font-medium text-[#1A3263]">{currentUser?.email || '-'}</p>
        <p className="mt-3 text-sm text-[#5A6E9A]">Role</p>
        <p className="text-base font-medium text-[#1A3263]">{currentUser?.role || '-'}</p>
      </div>
    </div>
  )
}

function AppShell({ children }) {
  const { currentUser } = useAuth()
  const { projects, loading } = useProject()
  const [mobileOpen, setMobileOpen] = useState(false)
  const canCreateProjects = ['ADMIN', 'QA_MANAGER'].includes(currentUser?.role || '')

  if (!loading && projects.length === 0 && canCreateProjects) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] md:flex">
      <Sidebar activeProjectId={projects[0]?.id || null} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between border-b border-[#D6E0F5] bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded border border-[#D6E0F5] px-3 py-1 text-sm text-[#1A3263]">
            Menu
          </button>
          <p className="text-sm font-semibold text-[#1A3263]">TestForge</p>
        </div>
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute permission="createProject"><AppShell><OnboardingPage /></AppShell></ProtectedRoute>} />
      <Route path="/projects/:projectId/test-cases" element={<ProtectedRoute><AppShell><TestCasesPage /></AppShell></ProtectedRoute>} />
      <Route path="/projects/:projectId/test-cases/new" element={<ProtectedRoute permission="createTestCase"><AppShell><TestCaseFormPage /></AppShell></ProtectedRoute>} />
      <Route path="/projects/:projectId/test-cases/:id" element={<ProtectedRoute><AppShell><TestCaseDetailPage /></AppShell></ProtectedRoute>} />
      <Route path="/projects/:projectId/test-cases/:id/edit" element={<ProtectedRoute permission="editTestCase"><AppShell><TestCaseFormPage /></AppShell></ProtectedRoute>} />
      <Route path="/projects/:projectId/runs" element={<ProtectedRoute><AppShell><TestRunsPage /></AppShell></ProtectedRoute>} />
      <Route path="/projects/:projectId/runs/:id" element={<ProtectedRoute permission="executeTestRun"><ExecutionRoute /></ProtectedRoute>} />
      <Route path="/projects/:projectId/reports" element={<ProtectedRoute><AppShell><ReportsPage /></AppShell></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute permission="manageTeam"><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
      <Route path="/settings/team" element={<ProtectedRoute permission="manageTeam"><AppShell><TeamPage /></AppShell></ProtectedRoute>} />
      <Route path="/settings/billing" element={<ProtectedRoute permission="accessBilling"><AppShell><BillingPage /></AppShell></ProtectedRoute>} />
      <Route path="/settings/profile" element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
      <Route path="/billing/success" element={<ProtectedRoute><BillingSuccessPage /></ProtectedRoute>} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

function ExecutionRoute() {
  const navigate = useNavigate()
  const { id, projectId } = useParams()
  return (
    <AppShell>
      <ExecutionMode projectId={projectId} runId={id} onExit={() => navigate(`/projects/${projectId}/runs`)} />
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProjectProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProjectProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
