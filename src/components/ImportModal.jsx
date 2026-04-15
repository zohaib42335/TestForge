import { useMemo, useState } from 'react'
import { importTestCases } from '../api/testCases.api.js'

export default function ImportModal({ open, projectId, onClose, onImport }) {
  const [json, setJson] = useState('[]')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const parsedRows = useMemo(() => {
    try {
      const value = JSON.parse(json)
      return Array.isArray(value) ? value : []
    } catch {
      return null
    }
  }, [json])

  if (!open) return null

  const submit = async () => {
    if (!projectId || !parsedRows) return
    setLoading(true)
    try {
      const data = await importTestCases(projectId, parsedRows)
      setResult(data)
      onImport?.(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#B0C0E0] bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-[#1A3263]">Import Test Cases</h3>
        <p className="mb-2 text-xs text-[#5A6E9A]">Paste JSON array that frontend mapping produced.</p>
        <textarea className="h-60 w-full rounded border p-2 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
        {parsedRows === null ? <p className="mt-2 text-xs text-red-600">Invalid JSON</p> : null}
        {result ? <p className="mt-2 text-xs text-[#1A3263]">Created: {result.created || 0}, Failed: {result.failed || 0}</p> : null}
        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded border px-3 py-1 text-sm" onClick={onClose}>Close</button>
          <button disabled={loading || parsedRows === null} onClick={submit} className="rounded bg-[#1A3263] px-3 py-1 text-sm text-white disabled:opacity-50">
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
