import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function TestCaseTable({
  testCases = [],
  suites = [],
  loading = false,
  error = '',
  onEdit,
  onDelete,
  onApprove,
  onDuplicate,
  onFilterChange,
}) {
  const { isAdmin, isQAManager } = useAuth()
  const canApprove = isAdmin || isQAManager
  const [suiteId, setSuiteId] = useState('')
  const [status, setStatus] = useState('')

  const suiteOptions = useMemo(() => [{ id: '', name: 'All Suites' }, ...suites], [suites])

  const applyFilters = (nextSuiteId, nextStatus) => {
    onFilterChange?.({
      suiteId: nextSuiteId || undefined,
      status: nextStatus || undefined,
    })
  }

  if (loading) return <div className="rounded border bg-white p-4 text-sm">Loading test cases...</div>

  return (
    <div className="space-y-3 rounded-xl border border-[#B0C0E0] bg-white p-4">
      <div className="flex gap-2">
        <select
          className="rounded border px-2 py-1 text-sm"
          value={suiteId}
          onChange={(e) => {
            const value = e.target.value
            setSuiteId(value)
            applyFilters(value, status)
          }}
        >
          {suiteOptions.map((suite) => <option key={suite.id || 'all'} value={suite.id}>{suite.name}</option>)}
        </select>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={status}
          onChange={(e) => {
            const value = e.target.value
            setStatus(value)
            applyFilters(suiteId, value)
          }}
        >
          <option value="">All Statuses</option>
          <option value="NOT_RUN">Not Run</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
          <option value="BLOCKED">Blocked</option>
          <option value="SKIPPED">Skipped</option>
        </select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#1A3263]">
            <th>ID</th><th>Title</th><th>Suite</th><th>Status</th><th>Approved</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((tc) => (
            <tr key={tc.id} className="border-t">
              <td>{tc.testCaseId}</td>
              <td>{tc.title}</td>
              <td>{tc.suite?.name || '-'}</td>
              <td>{tc.status}</td>
              <td>{tc.isApproved ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Approved</span> : '-'}</td>
              <td className="space-x-2">
                <button onClick={() => onEdit?.(tc)} className="text-blue-700">Edit</button>
                <button onClick={() => onDuplicate?.(tc)} className="text-indigo-700">Duplicate</button>
                {canApprove && !tc.isApproved ? <button onClick={() => onApprove?.(tc)} className="text-green-700">Approve</button> : null}
                <button onClick={() => onDelete?.(tc)} className="text-red-700">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
