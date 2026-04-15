import { useEffect, useState } from 'react'
import { getProjectActivity } from '../api/activityLogs.api.js'
import { useProjectContext } from '../context/ProjectContext.jsx'

export default function ActivityLog() {
  const { activeProject } = useProjectContext()
  const projectId = activeProject?.id
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFilters] = useState({
    entityType: '',
    actorId: '',
  })

  const load = async (nextPage = 1, append = false) => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const data = await getProjectActivity(projectId, {
        page: nextPage,
        limit: 20,
        entityType: filters.entityType || undefined,
        actorId: filters.actorId || undefined,
      })
      const rows = Array.isArray(data?.items) ? data.items : []
      setItems((prev) => (append ? [...prev, ...rows] : rows))
      setPage(nextPage)
      setHasMore(nextPage < Number(data?.totalPages || 1))
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load activity.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1, false)
  }, [projectId, filters.entityType, filters.actorId])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <div className="flex gap-2">
        <select className="rounded border px-2 py-1 text-xs" value={filters.entityType} onChange={(e) => setFilters((p) => ({ ...p, entityType: e.target.value }))}>
          <option value="">All Entities</option>
          <option value="testCase">Test Cases</option>
          <option value="testRun">Test Runs</option>
          <option value="comment">Comments</option>
        </select>
      </div>
      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div> : null}
      <div className="space-y-2 rounded border border-[#B0C0E0] bg-white p-3">
        {loading && items.length === 0 ? <p className="text-xs text-[#5A6E9A]">Loading...</p> : null}
        {!loading && items.length === 0 ? <p className="text-xs text-[#5A6E9A]">No activity found.</p> : null}
        {items.map((row) => (
          <div key={row.id} className="border-b pb-2 text-xs last:border-b-0 last:pb-0">
            <p className="text-[#1A3263]">{row.action}</p>
            <p className="text-[#5A6E9A]">{row.actor?.displayName || 'Unknown'} • {new Date(row.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <button className="rounded border px-3 py-1 text-xs" disabled={loading} onClick={() => void load(page + 1, true)}>
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
