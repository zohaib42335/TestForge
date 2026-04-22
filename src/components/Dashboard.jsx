import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useProject from '../hooks/useProject.js'
import { getOverviewReport, getTrendReport } from '../api/reports.api.js'
import usePermissions from '../hooks/usePermissions.js'
import { getProjectActivity } from '../api/activityLogs.api.js'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'

function LineChart({ data = [] }) {
  const width = 860
  const height = 220
  const pad = 28
  if (!data.length) {
    return <p className="text-sm text-[#6A7FA6]">No trend data yet.</p>
  }
  const points = data.map((row, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1)
    const y = height - pad - ((row.passRate || 0) / 100) * (height - pad * 2)
    return { x, y, label: row.date, value: row.passRate || 0 }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#C8D7F1" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#C8D7F1" />
      <path d={areaPath} fill="#DDE8FF" opacity="0.8" />
      <path d={path} fill="none" stroke="#1A3263" strokeWidth="3" />
      {points.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} r="3" fill="#1A3263" />
      ))}
    </svg>
  )
}

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-[#B0C0E0] bg-white p-4">
      <p className="text-xs text-[#5A6E9A]">{label}</p>
      <p className="text-2xl font-semibold text-[#1A3263]">{value}</p>
    </div>
  )
}

function PassRateCard({ value }) {
  return (
    <div className="rounded-xl border-2 border-[#1A3263] bg-white p-4">
      <p className="text-xs text-[#5A6E9A]">Pass Rate</p>
      <p className="text-2xl font-semibold text-[#1A3263]">{value}%</p>
    </div>
  )
}

function StatusBreakdown({ overview }) {
  const total = Math.max(1, Number(overview?.totalCases || 0))
  const parts = [
    { key: 'PASS', value: Number(overview?.passCount || 0), color: 'bg-green-600', label: 'Pass' },
    { key: 'FAIL', value: Number(overview?.failCount || 0), color: 'bg-red-600', label: 'Fail' },
    { key: 'BLOCKED', value: Number(overview?.blockedCount || 0), color: 'bg-amber-600', label: 'Blocked' },
    { key: 'NOT_RUN', value: Number(overview?.notRunCount || 0), color: 'bg-[#9CA3AF]', label: 'Not Run' },
  ]
  return (
    <div className="rounded-xl border border-[#B0C0E0] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">Status Breakdown</h3>
      <div className="mb-3 flex h-3 overflow-hidden rounded bg-[#E6ECFA]">
        {parts.map((part) => (
          <div
            key={part.key}
            className={part.color}
            style={{ width: `${Math.round((part.value / total) * 100)}%` }}
            title={`${part.label}: ${part.value}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[#5A6E9A]">
        {parts.map((part) => (
          <div key={part.key} className="flex items-center justify-between rounded bg-[#F8FAFF] px-2 py-1">
            <span>{part.label}</span>
            <span className="font-semibold text-[#1A3263]">{part.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { activeProject } = useProject()
  const { can } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [activity, setActivity] = useState([])

  const load = useCallback(async () => {
    if (!activeProject?.id) return
    setLoading(true)
    setError('')
    try {
      const [overviewData, trendData] = await Promise.all([
        getOverviewReport(activeProject.id),
        getTrendReport(activeProject.id, 30),
      ])
      setOverview(overviewData)
      setTrends(Array.isArray(trendData) ? trendData : [])
      if (can('viewActivityLog')) {
        const logs = await getProjectActivity(activeProject.id, { page: 1, limit: 8 })
        setActivity(Array.isArray(logs?.items) ? logs.items : [])
      } else {
        setActivity([])
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not load dashboard analytics.')
    } finally {
      setLoading(false)
    }
  }, [activeProject?.id, can])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 60_000)
    return () => clearInterval(timer)
  }, [load])

  const bySuite = useMemo(() => overview?.bySuite || [], [overview])

  if (!activeProject?.id) {
    return <div className="rounded-xl border border-[#B0C0E0] bg-white p-4 text-sm text-[#4B5F87]">Select a project to view analytics.</div>
  }
  if (loading && !overview) return <LoadingState lines={5} />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if ((overview?.totalCases || 0) === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No test cases yet"
        subtitle={can('createTestCase')
          ? 'Create your first test case to start tracking quality.'
          : 'No test cases in this project yet.'}
        ctaLabel={can('createTestCase') ? 'Create Test Case' : undefined}
        onCta={can('createTestCase') ? () => navigate(`/projects/${activeProject?.id}/test-cases/new`) : undefined}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Card label="Total Cases" value={overview?.totalCases || 0} />
        <Card label="Pass" value={overview?.passCount || 0} />
        <Card label="Fail" value={overview?.failCount || 0} />
        <Card label="Blocked" value={overview?.blockedCount || 0} />
        <Card label="Not Run" value={overview?.notRunCount || 0} />
        <PassRateCard value={overview?.passRate || 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusBreakdown overview={overview} />
        <div className="rounded-xl border border-[#B0C0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-[#5A6E9A]">
              {can('viewActivityLog') ? 'No recent activity yet.' : 'Activity visible to Admin and QA Manager only.'}
            </p>
          ) : (
            <div className="space-y-2">
              {activity.map((entry) => (
                <div key={entry.id} className="rounded border border-[#EEF2FB] px-3 py-2 text-xs">
                  <p className="font-medium text-[#1A3263]">{entry.action}</p>
                  <p className="text-[#5A6E9A]">
                    {entry.actor?.displayName || 'Unknown'} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#B0C0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">Pass rate trend - last 30 days</h3>
          <LineChart data={trends} />
        </div>

        <div className="rounded-xl border border-[#B0C0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">By suite breakdown</h3>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[#53698F]">
                <tr>
                  <th className="py-2 pr-3">Suite</th>
                  <th className="py-2 pr-3">Cases</th>
                  <th className="py-2 pr-3">Pass</th>
                  <th className="py-2 pr-3">Fail</th>
                  <th className="py-2 pr-3">Blocked</th>
                  <th className="py-2 pr-3">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {bySuite.map((row) => {
                  const passRate = row.total > 0 ? Math.round((row.pass / row.total) * 100) : 0
                  return (
                    <tr key={row.suiteName} className="border-t border-[#EEF2FB]">
                      <td className="py-2 pr-3">{row.suiteName}</td>
                      <td className="py-2 pr-3">{row.total}</td>
                      <td className="py-2 pr-3 text-green-700">{row.pass}</td>
                      <td className="py-2 pr-3 text-red-700">{row.fail}</td>
                      <td className="py-2 pr-3 text-amber-700">{row.blocked}</td>
                      <td className="py-2 pr-3">
                        <div className="w-36 rounded bg-[#E6ECFA]">
                          <div className="h-2 rounded bg-[#1A3263]" style={{ width: `${Math.min(100, passRate)}%` }} />
                        </div>
                        <span className="ml-1 text-xs text-[#4B5F87]">{passRate}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
