/**
 * TestCaseTable — Displays all test cases in a styled table with search and filter.
 * @param {Object} props
 * @param {Array} props.testCases
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */

import { useMemo, useState } from 'react'
import TestCaseRow from './TestCaseRow.jsx'

const STATUS_FILTER_OPTIONS = ['All', 'Pass', 'Fail', 'Blocked', 'Not Executed']
const PRIORITY_FILTER_OPTIONS = ['All', 'High', 'Medium', 'Low']

/**
 * @param {string} q
 * @param {object} tc
 * @returns {boolean}
 */
function matchesSearch(q, tc) {
  if (!q) return true
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const fields = [tc?.testCaseId, tc?.module, tc?.title, tc?.assignedTo]
  return fields.some((f) => String(f ?? '').toLowerCase().includes(needle))
}

/**
 * @param {Object} props
 * @param {Array} props.testCases
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
export default function TestCaseTable({ testCases, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const list = Array.isArray(testCases) ? testCases : []

  const filtered = useMemo(() => {
    return list.filter((tc) => {
      if (!matchesSearch(search, tc)) return false
      if (statusFilter !== 'All' && String(tc?.status) !== statusFilter) return false
      if (priorityFilter !== 'All' && String(tc?.priority) !== priorityFilter) return false
      return true
    })
  }, [list, search, statusFilter, priorityFilter])

  const total = list.length
  const shown = filtered.length

  const filterBarClass =
    'bg-white border border-orange-300 text-stone-900 rounded-lg px-3 py-2 w-full sm:w-auto min-w-[10rem] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition placeholder:text-stone-400'
  const searchClass =
    'bg-white border border-orange-300 text-stone-900 rounded-lg px-3 py-2 w-full flex-1 min-w-[12rem] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition placeholder:text-stone-400'

  return (
    <div className="text-stone-900">
      <div className="flex flex-col lg:flex-row flex-wrap gap-3 mb-4 items-stretch lg:items-end">
        <label className="flex flex-col gap-1 flex-1 min-w-[12rem]">
          <span className="text-xs uppercase tracking-wider text-orange-600 font-mono">
            Search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, module, ID, assigned to…"
            className={searchClass}
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-orange-600 font-mono">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={filterBarClass}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-orange-600 font-mono">
            Priority
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={filterBarClass}
          >
            {PRIORITY_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-stone-500 mb-3">
        Showing {shown} of {total} test case{total === 1 ? '' : 's'}
      </p>

      {shown === 0 ? (
        <div className="rounded-xl border border-orange-200 bg-white shadow-sm py-16 px-6 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            📋
          </div>
          <p className="text-stone-600 text-sm max-w-md mx-auto">
            No test cases found. Create your first test case using the form.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-orange-200 shadow-sm">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-orange-500 text-white shadow-sm">
              <tr>
                {[
                  'Test Case ID',
                  'Module',
                  'Title',
                  'Priority',
                  'Severity',
                  'Status',
                  'Type',
                  'Assigned To',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className="py-3 px-4 text-xs uppercase tracking-wider font-mono border-b border-orange-200 whitespace-nowrap text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tc) => (
                <TestCaseRow
                  key={tc?.testCaseId ?? JSON.stringify(tc)}
                  testCase={tc}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
