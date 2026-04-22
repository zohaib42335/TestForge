import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTestRuns } from '../hooks/useTestRuns.js'
import usePermissions from '../hooks/usePermissions.js'
import CreateRunModal from '../components/TestRuns/CreateRunModal.jsx'
import ExecutionMode from '../components/TestRuns/ExecutionMode.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import EmptyState from '../components/EmptyState.jsx'

/**
 * Test runs listing page.
 *
 * @returns {import('react').ReactNode}
 */
export default function TestRunsPage() {
  const { projectId } = useParams()
  const { can } = usePermissions()
  const { runs, loading, error, startRun, deleteRun } = useTestRuns(projectId)
  const [showCreate, setShowCreate] = useState(false)
  const [activeRunId, setActiveRunId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const canCreate = can('createTestRun')
  const canDelete = can('deleteTestRun')
  const canExecute = can('executeTestRun')

  const cards = useMemo(() => (Array.isArray(runs) ? runs : []), [runs])

  if (activeRunId) {
    return (
      <ExecutionMode
        projectId={projectId}
        runId={activeRunId}
        onExit={() => setActiveRunId(null)}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A3263]">Test Runs</h1>
        {canCreate ? (
          <button type="button" onClick={() => setShowCreate(true)} className="rounded bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white">
            + New Run
          </button>
        ) : null}
      </div>

      {loading ? <LoadingState lines={5} /> : null}
      {error ? <ErrorState message={error} onRetry={() => window.location.reload()} /> : null}

      {cards.length === 0 && !loading ? (
        <EmptyState
          icon="▶"
          title="No test runs yet"
          subtitle={canCreate ? 'Create your first run to start execution.' : 'No test runs available.'}
          ctaLabel={canCreate ? 'New Run' : undefined}
          onCta={canCreate ? () => setShowCreate(true) : undefined}
        />
      ) : (
      <div className="space-y-3">
        {cards.map((run) => {
          const total = Number(run.totalCases || 0)
          const pass = Number(run.passCount || 0)
          const fail = Number(run.failCount || 0)
          const blocked = Number(run.blockedCount || 0)
          const done = pass + fail + blocked + Number(run.skippedCount || 0)
          const progress = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <div key={run.id} className="rounded-xl border border-[#D7E2F5] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A3263]">{run.name}</h3>
                  <p className="text-sm text-[#5A6E9A]">{run.description || 'No description'}</p>
                </div>
                <span className="rounded-full bg-[#EEF2FB] px-2 py-1 text-xs font-semibold text-[#1A3263]">
                  {run.status}
                </span>
              </div>
              <div className="mt-3 h-2 rounded bg-[#E6ECFA]">
                <div className="h-2 rounded bg-[#1A3263]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-[#5A6E9A]">
                {pass} passed, {fail} failed, {blocked} blocked, {Math.max(total - done, 0)} remaining
              </p>
              <div className="mt-3 flex gap-2">
                {canExecute ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await startRun(run.id)
                      setActiveRunId(run.id)
                    }}
                    className="rounded border border-[#B0C0E0] px-3 py-1 text-sm text-[#1A3263]"
                  >
                    Execute
                  </button>
                ) : (
                  <button type="button" onClick={() => setActiveRunId(run.id)} className="rounded border border-[#B0C0E0] px-3 py-1 text-sm text-[#1A3263]">
                    View
                  </button>
                )}
                {canDelete ? (
                  <button type="button" onClick={() => setDeleteId(run.id)} className="rounded border border-red-200 px-3 py-1 text-sm text-red-600">
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      )}

      {showCreate ? (
        <CreateRunModal
          projectId={projectId}
          testCases={[]}
          testCasesLoading={false}
          onClose={() => setShowCreate(false)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Are you sure?"
        description="This run will be deleted permanently."
        confirmLabel="Delete Run"
        confirmVariant="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return
          await deleteRun(deleteId)
          setDeleteId(null)
        }}
      />
    </div>
  )
}
