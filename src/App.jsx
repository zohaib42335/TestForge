/**
 * App — Root: Firebase Auth gate + main QA TestForge shell (localStorage data until Step 2).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import EditModal from './components/EditModal.jsx'
import ImportModal from './components/ImportModal.jsx'
import Login from './components/Login.jsx'
import TemplateLibrary from './components/TemplateLibrary.jsx'
import TestCaseForm from './components/TestCaseForm.jsx'
import TestCaseTable from './components/TestCaseTable.jsx'
import Toolbar from './components/Toolbar.jsx'
import { extractTokenFromUrl, initiateGoogleSignIn } from './utils/googleSheets.js'
import { saveCustomTemplate, deleteCustomTemplate } from './utils/templateStorage.js'
import { useTestCases } from './hooks/useTestCases.js'

/**
 * Full application shell (requires authenticated Firebase user).
 * @returns {import('react').JSX.Element}
 */
function AppAuthenticated() {
  const { user, signOutUser } = useAuth()

  const {
    testCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    syncStatus,
    resetSyncStatus,
    syncToSheets,
    exportExcel,
    clearAll,
    importValidatedTestCases,
  } = useTestCases()

  const [activeView, setActiveView] = useState(
    /** @type {'form' | 'table' | 'templates'} */ ('form'),
  )
  const [accessToken, setAccessToken] = useState(
    /** @type {string|null} */ (null),
  )
  const [editingTestCase, setEditingTestCase] = useState(
    /** @type {object|null} */ (null),
  )

  const [importOpen, setImportOpen] = useState(false)
  /** @type {[null | { text: string }, import('react').Dispatch<import('react').SetStateAction<null | { text: string }>>]} */
  const [importToast, setImportToast] = useState(null)

  const [templateApplyVersion, setTemplateApplyVersion] = useState(0)
  const [templateDefaultsState, setTemplateDefaultsState] = useState(
    /** @type {Record<string, string>} */ ({}),
  )
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0)

  useEffect(() => {
    const token = extractTokenFromUrl()
    if (token) {
      setAccessToken(token)
      const path = window.location.pathname + window.location.search
      window.history.replaceState(null, '', path)
    }
  }, [])

  useEffect(() => {
    if (!importToast) return
    const t = setTimeout(() => setImportToast(null), 6000)
    return () => clearTimeout(t)
  }, [importToast])

  const handleFormSubmit = useCallback(
    (formData) => {
      const result = addTestCase(formData)
      if (result.success) {
        setActiveView('table')
      }
      return result
    },
    [addTestCase],
  )

  const handleEdit = useCallback((tc) => {
    setEditingTestCase(tc)
  }, [])

  const handleModalSave = useCallback(
    (payload) => {
      const id = payload?.testCaseId
      if (id == null) return { success: false, errors: { testCaseId: 'Missing ID.' } }
      return updateTestCase(id, payload)
    },
    [updateTestCase],
  )

  const handleModalClose = useCallback(() => {
    setEditingTestCase(null)
  }, [])

  const handleSync = useCallback(() => {
    return syncToSheets(accessToken)
  }, [syncToSheets, accessToken])

  const handleDisconnectSheets = useCallback(() => {
    setAccessToken(null)
    resetSyncStatus()
  }, [resetSyncStatus])

  const handleUseTemplate = useCallback((defaults) => {
    setTemplateDefaultsState(defaults && typeof defaults === 'object' ? defaults : {})
    setTemplateApplyVersion((v) => v + 1)
    setActiveView('form')
  }, [])

  const handleSaveAsTemplate = useCallback(({ name, description, defaults }) => {
    const r = saveCustomTemplate({ name, description, defaults })
    if (!r.success) {
      window.alert(r.message || 'Could not save template.')
      return
    }
    setTemplateRefreshKey((k) => k + 1)
    window.alert('Template saved to this browser.')
  }, [])

  const handleDeleteTemplate = useCallback((id) => {
    if (!window.confirm('Delete this custom template?')) return
    deleteCustomTemplate(id)
    setTemplateRefreshKey((k) => k + 1)
  }, [])

  const handleImportBundle = useCallback(
    ({ validRows, skipped }) => {
      if (Array.isArray(validRows) && validRows.length > 0) {
        importValidatedTestCases(validRows)
      }
      const n = Array.isArray(validRows) ? validRows.length : 0
      const s = typeof skipped === 'number' ? skipped : 0
      setImportToast({
        text: `${n} test case${n === 1 ? '' : 's'} imported successfully, ${s} skipped due to errors.`,
      })
    },
    [importValidatedTestCases],
  )

  const handleFirebaseSignOut = useCallback(async () => {
    await signOutUser()
  }, [signOutUser])

  const count = Array.isArray(testCases) ? testCases.length : 0

  const authProfile = useMemo(() => {
    if (!user) return null
    const isGoogle =
      Array.isArray(user.providerData) &&
      user.providerData.some((p) => p?.providerId === 'google.com')
    return {
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      displayName: user.displayName ?? null,
      isGoogle,
    }
  }, [user])

  return (
    <div className="min-h-screen flex flex-col bg-orange-50 text-stone-900">
      <Toolbar
        onSync={handleSync}
        onExport={exportExcel}
        syncStatus={syncStatus}
        accessToken={accessToken}
        onSignIn={initiateGoogleSignIn}
        onDisconnectSheets={handleDisconnectSheets}
        onClearAll={clearAll}
        onImport={() => setImportOpen(true)}
        onSignOut={handleFirebaseSignOut}
        authProfile={authProfile}
      />

      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-orange-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveView('form')}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${
              activeView === 'form'
                ? 'bg-orange-500 text-white'
                : 'text-stone-600 hover:text-orange-600'
            }`}
          >
            ➕ New Test Case
          </button>
          <button
            type="button"
            onClick={() => setActiveView('templates')}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${
              activeView === 'templates'
                ? 'bg-orange-500 text-white'
                : 'text-stone-600 hover:text-orange-600'
            }`}
          >
            📚 Template Library
          </button>
          <button
            type="button"
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${
              activeView === 'table'
                ? 'bg-orange-500 text-white'
                : 'text-stone-600 hover:text-orange-600'
            }`}
          >
            📋 View All ({count})
          </button>
        </div>

        {activeView === 'form' && (
          <TestCaseForm
            onSubmit={handleFormSubmit}
            isSubmitting={false}
            templateApplyVersion={templateApplyVersion}
            templateDefaults={templateDefaultsState}
            onSaveAsTemplate={handleSaveAsTemplate}
          />
        )}
        {activeView === 'templates' && (
          <TemplateLibrary
            onUseTemplate={handleUseTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            refreshKey={templateRefreshKey}
          />
        )}
        {activeView === 'table' && (
          <TestCaseTable
            testCases={testCases}
            onEdit={handleEdit}
            onDelete={deleteTestCase}
          />
        )}
      </div>

      <EditModal
        testCase={editingTestCase}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportBundle}
      />

      {importToast && (
        <div
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 max-w-lg w-[90vw] rounded-lg border border-green-200 bg-green-50 border-l-4 border-l-green-500 px-5 py-4 text-center text-sm text-green-800 shadow-sm"
          role="status"
        >
          {importToast.text}
        </div>
      )}
    </div>
  )
}

/**
 * Shows a loading state until Firebase reports the initial auth session.
 * @returns {import('react').JSX.Element}
 */
function AuthGate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 text-stone-500 gap-4">
        <span
          className="inline-block w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-sm font-mono">Checking authentication…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <AppAuthenticated />
}

/**
 * Root export: wraps the tree with Firebase AuthProvider.
 * @returns {import('react').JSX.Element}
 */
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
