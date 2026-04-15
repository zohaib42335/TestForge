import { useMemo, useState } from 'react'
import { useRunExecution } from '../../hooks/useRunExecution.js'
import { useToast } from '../Toast.jsx'

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
  const { run, results, loading, error, computedStats, updateResult } = useRunExecution(projectId, runId)
  const [pendingIds, setPendingIds] = useState(new Set())

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
      await updateResult(row.id, { result: nextResult, notes: row.notes || '' })
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
                  </div>
                  <span className="rounded-full bg-[#EEF2FB] px-2 py-1 text-xs text-[#1A3263]">
                    {statusLabel(row.result)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton label="Pass" color="green" disabled={pendingIds.has(row.id)} onClick={() => onSetResult(row, 'PASS')} />
                  <ActionButton label="Fail" color="red" disabled={pendingIds.has(row.id)} onClick={() => onSetResult(row, 'FAIL')} />
                  <ActionButton label="Blocked" color="amber" disabled={pendingIds.has(row.id)} onClick={() => onSetResult(row, 'BLOCKED')} />
                  <ActionButton label="Skip" color="gray" disabled={pendingIds.has(row.id)} onClick={() => onSetResult(row, 'SKIPPED')} />
                </div>
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
