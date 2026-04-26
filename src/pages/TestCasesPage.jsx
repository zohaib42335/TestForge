import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getSuites } from '../api/testSuites.api.js'
import { getCompanyUsers } from '../api/users.api.js'
import { useTestCases } from '../hooks/useTestCases.js'
import usePermissions from '../hooks/usePermissions.js'
import TestCaseForm from '../components/TestCaseForm.jsx'
import TestCaseRow from '../components/TestCaseRow.jsx'
import TestCaseDetailPanel from '../components/TestCaseDetailPanel.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'

/**
 * Test cases listing and CRUD page.
 *
 * @returns {import('react').ReactNode}
 */
export default function TestCasesPage() {
  const { currentUser } = useAuth()
  const { projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = usePermissions()
  const [suites, setSuites] = useState([])
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const appliedMineForUserRef = useRef(null)
  const [filters, setFilters] = useState({
    search: '',
    suiteId: '',
    status: '',
    priority: '',
  })

  const {
    testCases,
    loading,
    error,
    total,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    duplicateTestCase,
    applyFilters,
  } = useTestCases(projectId, {})

  useEffect(() => {
    if (!projectId) return
    void getSuites(projectId).then((data) => setSuites(Array.isArray(data) ? data : []))
    void getCompanyUsers().then((data) => setMembers(Array.isArray(data) ? data : []))
  }, [projectId])

  useEffect(() => {
    const shouldFilterMine = searchParams.get('mine') === 'true'
    const userId = currentUser?.id || null
    if (shouldFilterMine && userId && appliedMineForUserRef.current !== userId) {
      appliedMineForUserRef.current = userId
      applyFilters({ assignedToId: currentUser.id })
    }
    if (!shouldFilterMine) {
      appliedMineForUserRef.current = null
    }
  }, [searchParams, currentUser?.id, applyFilters])

  const isEmpty = !loading && testCases.length === 0
  const canManage = can('createTestCase')
  const canEdit = can('editTestCase')
  const canDelete = can('deleteTestCase')

  const headerActions = useMemo(() => (
    <div className="flex gap-2">
      {can('importTestCases') ? (
        <button className="rounded border border-[#D6E0F5] px-3 py-2 text-sm text-[#1A3263]">Import</button>
      ) : null}
      {can('manageSuites') ? (
        <button className="rounded border border-[#D6E0F5] px-3 py-2 text-sm text-[#1A3263]">Manage Suites</button>
      ) : null}
      {canManage ? (
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="rounded bg-[#1A3263] px-3 py-2 text-sm font-semibold text-white"
        >
          + New Test Case
        </button>
      ) : null}
    </div>
  ), [can, canManage])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-[#1A3263]">Test Cases</h1>
          <span className="rounded-full bg-[#EEF2FB] px-2 py-1 text-xs font-semibold text-[#1A3263]">
            {total}
          </span>
        </div>
        {headerActions}
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-5">
        <input
          className="rounded border border-[#D6E0F5] px-3 py-2 text-sm"
          placeholder="Search title or TC ID"
          value={filters.search}
          onChange={(e) => {
            const value = e.target.value
            setFilters((prev) => ({ ...prev, search: value }))
            applyFilters({ search: value || undefined })
          }}
        />
        <select className="rounded border border-[#D6E0F5] px-3 py-2 text-sm" value={filters.suiteId} onChange={(e) => {
          const value = e.target.value
          setFilters((prev) => ({ ...prev, suiteId: value }))
          applyFilters({ suiteId: value || undefined })
        }}>
          <option value="">All suites</option>
          {suites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name}</option>)}
        </select>
        <select className="rounded border border-[#D6E0F5] px-3 py-2 text-sm" value={filters.status} onChange={(e) => {
          const value = e.target.value
          setFilters((prev) => ({ ...prev, status: value }))
          applyFilters({ status: value || undefined })
        }}>
          <option value="">All statuses</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
          <option value="BLOCKED">Blocked</option>
          <option value="NOT_RUN">Not Run</option>
        </select>
        <select className="rounded border border-[#D6E0F5] px-3 py-2 text-sm" value={filters.priority} onChange={(e) => {
          const value = e.target.value
          setFilters((prev) => ({ ...prev, priority: value }))
          applyFilters({ priority: value || undefined })
        }}>
          <option value="">All priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button
          type="button"
          className="rounded border border-[#D6E0F5] px-3 py-2 text-sm text-[#1A3263]"
          onClick={() => {
            setFilters({ search: '', suiteId: '', status: '', priority: '' })
            setSearchParams({})
            applyFilters({
              search: undefined,
              suiteId: undefined,
              status: undefined,
              priority: undefined,
            })
          }}
        >
          Clear filters
        </button>
      </div>

      {loading ? <LoadingState lines={6} /> : null}
      {error ? <ErrorState message={error} onRetry={() => applyFilters({})} /> : null}

      {isEmpty ? (
        <EmptyState
          icon="📋"
          title="No test cases yet"
          subtitle={canManage
            ? 'Create your first test case to start tracking quality.'
            : 'No test cases in this project yet.'}
          ctaLabel={canManage ? 'Create Test Case' : undefined}
          onCta={canManage ? () => setShowForm(true) : undefined}
        />
      ) : (
        <div className="overflow-auto rounded-xl border border-[#D7E2F5] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F7F9FF] text-[#53698F]">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Assigned To</th>
                <th className="px-3 py-2">Created Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((row) => (
                <TestCaseRow
                  key={row.id}
                  testCase={{
                    ...row,
                    module: row.suite?.name || 'Unassigned',
                    assignedTo: row.assignedTo?.displayName || row.assignedTo?.email || '-',
                    createdDate: row.createdAt,
                  }}
                  showEdit={canEdit}
                  showDelete={canDelete}
                  showView={!canEdit}
                  onEdit={(tc) => {
                    setEditing(row)
                    setShowForm(true)
                  }}
                  onView={() => setSelected(row)}
                  onDuplicate={can('duplicateTestCase') ? () => void duplicateTestCase(row.id) : undefined}
                  onRequestDelete={() => setDeleteTarget(row)}
                  onOpenDetail={() => setSelected(row)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto max-w-4xl">
            <TestCaseForm
              mode={editing ? 'edit' : 'create'}
              initialValues={editing || {}}
              suites={suites}
              members={members}
              isSubmitting={busy}
              onCancel={() => {
                setShowForm(false)
                setEditing(null)
              }}
              onSubmit={async (payload) => {
                setBusy(true)
                try {
                  if (editing?.id) {
                    await updateTestCase(editing.id, payload)
                  } else {
                    await createTestCase(payload)
                  }
                  setShowForm(false)
                  setEditing(null)
                } finally {
                  setBusy(false)
                }
              }}
            />
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Are you sure?"
        description="This test case will be deleted permanently."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          setBusy(true)
          try {
            await deleteTestCase(deleteTarget.id)
            setDeleteTarget(null)
          } finally {
            setBusy(false)
          }
        }}
      />

      <TestCaseDetailPanel testCase={selected} onClose={() => setSelected(null)} onCommentPosted={() => {}} />
    </div>
  )
}
