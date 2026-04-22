import { useMemo, useState } from 'react'
import { useRunExecution } from '../../hooks/useRunExecution.js'
import { useToast } from '../Toast.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function statusLabel(value) {
  const map = {
    PASS: 'Pass',
    FAIL: 'Fail',
    BLOCKED: 'Blocked',
    SKIPPED: 'Skipped',
    NOT_RUN: 'Not Run',
  }
  return map[value] || value
}

export default function ExecutionMode({ projectId, runId, onExit }) {
  const showToast = useToast()
  const { currentUser } = useAuth()
  const { run, results, loading, error, computedStats, updateResult } = useRunExecution(projectId, runId)
  const [pendingIds, setPendingIds] = useState(new Set())
  const [notesById, setNotesById] = useState({})

  const orderedResults = useMemo(() => {
    const clone = [...results]
    clone.sort((a, b) => {
      if (a.result === 'NOT_RUN' && b.result !== 'NOT_RUN') return -1
      if (a.result !== 'NOT_RUN' && b.result === 'NOT_RUN') return 1
      return String(a.testCase?.testCaseId || '').localeCompare(String(b.testCase?.testCaseId || ''))
    })
    return clone
  }, [results])

  const onSetResult = async (row, nextResult) => {
    setPendingIds((prev) => new Set(prev).add(row.id))
    try {
      await updateResult(row.id, { result: nextResult, notes: notesById[row.id] ?? row.notes ?? '' })
    } catch (err) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to update result.', 'error')
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(row.id)
        return next
      })
    }
  }

  const canEditResult = (row) => {
    const role = currentUser?.role
    if (role === 'ADMIN' || role === 'QA_MANAGER') return true
    if (role === 'TESTER') {
      return row?.testCase?.assignedToId && row.testCase.assignedToId === currentUser?.id
    }
    return false
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#EEF2FB] p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#B0C0E0] bg-white p-3">
          <button className="text-sm text-[#1A3263]" onClick={onExit}>← Back to Runs</button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1A3263]">{run?.name || 'Run Execution'}</p>
            <p className="text-xs text-[#5A6E9A]">{computedStats.done}/{computedStats.total} executed</p>
          </div>
          <div className="text-right text-xs text-[#5A6E9A]">
            <div>Pass: {computedStats.passCount}</div>
            <div>Fail: {computedStats.failCount}</div>
          </div>
        </div>

        {error ? <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="rounded border bg-white p-4 text-sm">Loading execution mode...</div> : null}

        {!loading && (
          <div className="space-y-2">
            {orderedResults.map((row) => (
              <div key={row.id} className="rounded-lg border border-[#B0C0E0] bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-[#5A6E9A]">{row.testCase?.testCaseId || row.testCaseId}</p>
                    <p className="text-sm font-medium text-[#1A3263]">{row.testCase?.title || row.testCaseTitle}</p>
                    <p className="text-xs text-[#5A6E9A]">
                      Assigned to: {row.testCase?.assignedTo?.displayName || 'Unassigned'}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#EEF2FB] px-2 py-1 text-xs text-[#1A3263]">
                    {statusLabel(row.result)}
                  </span>
                </div>
                {!canEditResult(row) ? (
                  <p className="mb-2 text-xs text-[#5A6E9A]">
                    View only: testers can execute only test cases assigned to them.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <ActionButton label="Pass" color="green" disabled={pendingIds.has(row.id) || !canEditResult(row)} onClick={() => onSetResult(row, 'PASS')} />
                  <ActionButton label="Fail" color="red" disabled={pendingIds.has(row.id) || !canEditResult(row)} onClick={() => onSetResult(row, 'FAIL')} />
                  <ActionButton label="Blocked" color="amber" disabled={pendingIds.has(row.id) || !canEditResult(row)} onClick={() => onSetResult(row, 'BLOCKED')} />
                  <ActionButton label="Skip" color="gray" disabled={pendingIds.has(row.id) || !canEditResult(row)} onClick={() => onSetResult(row, 'SKIPPED')} />
                </div>
                {(row.result === 'FAIL' || row.result === 'BLOCKED') ? (
                  <div className="mt-2">
                    <textarea
                      value={notesById[row.id] ?? row.notes ?? ''}
                      onChange={(e) => setNotesById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      disabled={!canEditResult(row)}
                      placeholder="Add notes for failure/blocked"
                      className="w-full rounded border border-[#D6E0F5] p-2 text-xs disabled:bg-[#F5F8FF]"
                      rows={2}
                    />
                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        disabled={!canEditResult(row) || pendingIds.has(row.id)}
                        onClick={() => onSetResult(row, row.result)}
                        className="rounded border border-[#B0C0E0] px-2 py-1 text-xs text-[#1A3263] disabled:opacity-50"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({ label, color, disabled, onClick }) {
  const colorClass =
    color === 'green'
      ? 'border-green-600 text-green-700'
      : color === 'red'
        ? 'border-red-600 text-red-700'
        : color === 'amber'
          ? 'border-amber-600 text-amber-700'
          : 'border-gray-500 text-gray-700'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded border px-3 py-1 text-xs ${colorClass} disabled:opacity-50`}
    >
      {label}
    </button>
  )
}
