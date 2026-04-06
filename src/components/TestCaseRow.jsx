/**
 * TestCaseRow — Table row for a single test case.
 * @param {Object} props
 * @param {Object} props.testCase - Test case data
 * @param {Function} props.onEdit - Called with testCase when Edit clicked
 * @param {Function} props.onDelete - Called with testCaseId when Delete clicked
 */

import StatusBadge from './StatusBadge.jsx'

/**
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncateTitle(text, max) {
  const s = text == null ? '' : String(text)
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

/**
 * @param {Object} props
 * @param {Object} props.testCase
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
export default function TestCaseRow({ testCase, onEdit, onDelete }) {
  const id = testCase?.testCaseId ?? ''
  const title = testCase?.title ?? ''
  const titleShort = truncateTitle(title, 40)

  const handleDelete = () => {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`Delete test case ${id}? This cannot be undone.`)
    ) {
      onDelete(id)
    }
  }

  return (
    <tr className="odd:bg-white even:bg-orange-50 hover:bg-orange-100 transition">
      <td className="py-3 px-4 text-sm text-stone-800 border-b border-orange-200 font-mono">
        {id || '—'}
      </td>
      <td className="py-3 px-4 text-sm text-stone-800 border-b border-orange-200">
        {testCase?.module ?? '—'}
      </td>
      <td
        className="py-3 px-4 text-sm text-stone-800 border-b border-orange-200 max-w-[14rem]"
        title={title}
      >
        {titleShort || '—'}
      </td>
      <td className="py-3 px-4 text-sm border-b border-orange-200">
        <StatusBadge value={testCase?.priority} type="priority" />
      </td>
      <td className="py-3 px-4 text-sm border-b border-orange-200">
        <StatusBadge value={testCase?.severity} type="severity" />
      </td>
      <td className="py-3 px-4 text-sm border-b border-orange-200">
        <StatusBadge value={testCase?.status} type="status" />
      </td>
      <td className="py-3 px-4 text-sm text-stone-800 border-b border-orange-200">
        {testCase?.testType ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm text-stone-800 border-b border-orange-200">
        {testCase?.assignedTo ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm border-b border-orange-200 whitespace-nowrap">
        <button
          type="button"
          onClick={() => onEdit(testCase)}
          className="mr-2 px-3 py-1 rounded-lg text-xs font-semibold text-orange-500 hover:text-orange-700 transition"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-3 py-1 rounded-lg text-xs font-semibold text-red-500 hover:text-red-700 transition"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
