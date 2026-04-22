import { useEffect, useState } from 'react'
import { getEntityActivity } from '../api/activityLogs.api.js'
import Comments from './Comments.jsx'

export default function TestCaseDetailPanel({ testCase, onClose, onCommentPosted }) {
  const testCaseId = testCase?.id
  const [tab, setTab] = useState('comments')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (!testCaseId || tab !== 'history') return
    setHistoryLoading(true)
    getEntityActivity(testCaseId)
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .finally(() => setHistoryLoading(false))
  }, [tab, testCaseId])

  if (!testCaseId) return null

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] border-l bg-white shadow-xl">
      <header className="flex items-center justify-between bg-[#1A3263] px-4 py-3 text-white">
        <h2 className="text-sm font-medium">{testCase?.testCaseId} — {testCase?.title}</h2>
        <button onClick={onClose}>×</button>
      </header>
      <div className="max-h-[calc(100vh-52px)] overflow-y-auto p-3">
        <div className="mb-3 grid grid-cols-2 gap-2 rounded border border-[#D6E0F5] bg-[#F8FAFF] p-2 text-xs">
          <Field label="Suite" value={testCase?.suite?.name || testCase?.module || '—'} />
          <Field label="Status" value={testCase?.status || '—'} />
          <Field label="Priority" value={testCase?.priority || '—'} />
          <Field label="Severity" value={testCase?.severity || '—'} />
          <Field label="Type" value={testCase?.testType || '—'} />
          <Field label="Assigned To" value={testCase?.assignedTo?.displayName || testCase?.assignedTo || '—'} />
          <Field label="Created By" value={testCase?.createdBy?.displayName || '—'} />
          <Field label="Created Date" value={testCase?.createdAt ? new Date(testCase.createdAt).toLocaleString() : '—'} />
          <div className="col-span-2">
            <p className="font-semibold text-[#5A6E9A]">Pre-conditions</p>
            <p className="text-[#1A3263]">{testCase?.preConditions || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-[#5A6E9A]">Description</p>
            <p className="text-[#1A3263]">{testCase?.description || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-[#5A6E9A]">Test Steps</p>
            <ol className="list-decimal pl-5 text-[#1A3263]">
              {(Array.isArray(testCase?.testSteps) ? testCase.testSteps : []).map((row, idx) => (
                <li key={`${idx}`} className="mb-1">
                  <span>{row.action || row.step || '—'}</span>
                  <span className="block text-[#5A6E9A]">Expected: {row.expectedResult || row.expected || '—'}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="col-span-2">
            <p className="font-semibold text-[#5A6E9A]">Expected Result</p>
            <p className="text-[#1A3263]">{testCase?.expectedResult || '—'}</p>
          </div>
        </div>
        <div className="mb-3 flex border-b">
          <button className={`flex-1 pb-2 text-xs ${tab === 'comments' ? 'text-[#1A3263]' : 'text-[#5A6E9A]'}`} onClick={() => setTab('comments')}>
            Comments ({commentCount})
          </button>
          <button className={`flex-1 pb-2 text-xs ${tab === 'history' ? 'text-[#1A3263]' : 'text-[#5A6E9A]'}`} onClick={() => setTab('history')}>
            History ({history.length})
          </button>
        </div>
        {tab === 'comments' ? (
          <Comments
            testCaseId={testCaseId}
            onPosted={onCommentPosted}
            onThreadSizeChange={setCommentCount}
            hideHeader
          />
        ) : (
          <div className="space-y-2">
            {historyLoading ? <p className="text-xs text-[#5A6E9A]">Loading history...</p> : null}
            {!historyLoading && history.length === 0 ? <p className="text-xs text-[#5A6E9A]">No history yet.</p> : null}
            {history.map((entry) => (
              <div key={entry.id} className="rounded border p-2 text-xs">
                <p className="text-[#1A3263]">{entry.action}</p>
                <p className="text-[#5A6E9A]">{entry.actor?.displayName || 'Unknown'} • {new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="font-semibold text-[#5A6E9A]">{label}</p>
      <p className="text-[#1A3263]">{value}</p>
    </div>
  )
}
