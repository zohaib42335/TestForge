import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRuns } from '../api/testRuns.api.js'
import {
  getCoverageReport,
  getExecutionReport,
  getOverviewReport,
  getTrendReport,
} from '../api/reports.api.js'
import useProject from '../hooks/useProject.js'
import usePermissions from '../hooks/usePermissions.js'
import { useToast } from '../components/Toast.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'

function LineChart({ data = [] }) {
  const width = 860
  const height = 220
  const pad = 28
  if (!data.length) return <p className="text-sm text-[#6A7FA6]">No trend data available.</p>
  const points = data.map((row, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, data.length - 1)
    const y = height - pad - ((row.passRate || 0) / 100) * (height - pad * 2)
    return { x, y }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#C8D7F1" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#C8D7F1" />
      <path d={areaPath} fill="#DDE8FF" opacity="0.75" />
      <path d={path} fill="none" stroke="#1A3263" strokeWidth="3" />
    </svg>
  )
}

function minutesToDuration(minutes) {
  if (minutes == null) return 'Not completed'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `Completed in ${hours} hours ${mins} minutes`
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { can, role } = usePermissions()
  const { projectId: routeProjectId } = useParams()
  const { activeProject } = useProject()
  const projectId = routeProjectId || activeProject?.id
  const [section, setSection] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [coverage, setCoverage] = useState(null)
  const [trends, setTrends] = useState([])
  const [runs, setRuns] = useState([])
  const [selectedRunId, setSelectedRunId] = useState('')
  const [execution, setExecution] = useState(null)
  const deniedReports = role === 'TESTER' || !can('viewReports')

  useEffect(() => {
    if (deniedReports) {
      showToast("You don't have access to reports", 'info')
      navigate('/dashboard', { replace: true })
    }
  }, [deniedReports, navigate, showToast])

  const loadOverview = useCallback(async () => {
    if (!projectId || deniedReports) return
    setLoading(true)
    setError('')
    try {
      const [overviewData, coverageData, trendData, runsData] = await Promise.all([
        getOverviewReport(projectId),
        getCoverageReport(projectId),
        getTrendReport(projectId, 30),
        getRuns(projectId, { page: 1, limit: 100 }),
      ])
      setOverview(overviewData)
      setCoverage(coverageData)
      setTrends(Array.isArray(trendData) ? trendData : [])
      const allRuns = runsData?.items || []
      setRuns(allRuns)
      if (allRuns.length && !selectedRunId) {
        setSelectedRunId(allRuns[0].id)
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedRunId, deniedReports])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (!projectId || !selectedRunId || deniedReports) return
    void (async () => {
      try {
        const data = await getExecutionReport(projectId, selectedRunId)
        setExecution(data)
      } catch (err) {
        setError(err?.response?.data?.error?.message || 'Could not load execution report.')
      }
    })()
  }, [projectId, selectedRunId, deniedReports])

  const priorityRows = useMemo(
    () => Object.entries(overview?.byPriority || {}).sort((a, b) => b[1] - a[1]),
    [overview?.byPriority],
  )
  const typeRows = useMemo(
    () => Object.entries(overview?.byTestType || {}).sort((a, b) => b[1] - a[1]),
    [overview?.byTestType],
  )

  const exportOverview = async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          totalCases: overview?.totalCases || 0,
          passCount: overview?.passCount || 0,
          failCount: overview?.failCount || 0,
          blockedCount: overview?.blockedCount || 0,
          notRunCount: overview?.notRunCount || 0,
          passRate: overview?.passRate || 0,
        },
      ]),
      'Overview',
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(overview?.bySuite || []),
      'BySuite',
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(trends || []),
      'Trends',
    )
    XLSX.writeFile(wb, `testforge-overview-${activeProject?.name || projectId || 'project'}.xlsx`)
  }

  const exportExecutionAsPdf = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !execution) return
    printWindow.document.write(`
      <html><head><title>Execution Report</title><style>
      body{font-family:Arial,sans-serif;padding:24px}
      h1,h2{color:#1A3263}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #dbe3f4;padding:8px;text-align:left}
      </style></head><body>
      <h1>Execution Report - ${execution.run?.name || ''}</h1>
      <p>Pass Rate: ${execution.passRate}%</p>
      <p>Completion Rate: ${execution.completionRate}%</p>
      <p>${minutesToDuration(execution.duration)}</p>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  if (!projectId) {
    return <div className="rounded-xl border border-[#D7E2F5] bg-white p-4 text-sm text-[#4B5F87]">Select a project to view reports.</div>
  }
  if (loading && !overview) return <LoadingState lines={5} />
  if (error) return <ErrorState message={error} onRetry={() => void loadOverview()} />

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-lg border border-[#C8D7F1] bg-white p-1">
        <button
          type="button"
          onClick={() => setSection('overview')}
          className={`rounded-md px-4 py-2 text-sm ${section === 'overview' ? 'bg-[#1A3263] text-white' : 'text-[#1A3263]'}`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setSection('execution')}
          className={`rounded-md px-4 py-2 text-sm ${section === 'execution' ? 'bg-[#1A3263] text-white' : 'text-[#1A3263]'}`}
        >
          Execution Reports
        </button>
      </div>

      {section === 'overview' ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1A3263]">Overview</h2>
              <button type="button" onClick={() => void exportOverview()} className="rounded-lg bg-[#1A3263] px-3 py-2 text-sm font-semibold text-white">Export Overview</button>
            </div>
            <p className={`mt-3 text-4xl font-bold ${Number(overview?.passRate || 0) >= 80 ? 'text-green-600' : Number(overview?.passRate || 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {overview?.passRate || 0}%
            </p>
          </div>

          <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">Pass rate trend - last 30 days</h3>
            <LineChart data={trends} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">Suite Coverage</h3>
              <p className="mb-3 text-sm text-[#4B5F87]">{coverage?.coveragePercent || 0}% suites with cases</p>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-[#53698F]">
                      <th className="py-2 pr-3 text-left">Suite</th>
                      <th className="py-2 pr-3 text-left">Cases</th>
                      <th className="py-2 pr-3 text-left">Pass Rate</th>
                      <th className="py-2 pr-3 text-left">Last Executed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(coverage?.suites || []).map((suite) => (
                      <tr key={suite.name} className="border-t border-[#EEF2FB]">
                        <td className="py-2 pr-3">{suite.name}</td>
                        <td className="py-2 pr-3">{suite.caseCount}</td>
                        <td className="py-2 pr-3">{suite.passRate}%</td>
                        <td className="py-2 pr-3">{suite.lastExecuted ? new Date(suite.lastExecuted).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">By Priority</h3>
              <div className="space-y-2">
                {priorityRows.map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs text-[#4B5F87]">
                      <span>{key.toUpperCase()}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2 rounded bg-[#E6ECFA]">
                      <div className="h-2 rounded bg-[#1A3263]" style={{ width: `${Math.min(100, ((value || 0) / Math.max(overview?.totalCases || 1, 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-[#1A3263]">By Test Type</h3>
              <div className="space-y-2">
                {typeRows.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm text-[#334A75]">
                    <span>{key}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#1A3263]">Execution Reports</h2>
              <div className="flex gap-2">
                <select
                  value={selectedRunId}
                  onChange={(event) => setSelectedRunId(event.target.value)}
                  className="rounded-md border border-[#C8D7F1] px-3 py-2 text-sm"
                >
                  <option value="">Select a run</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>{run.name}</option>
                  ))}
                </select>
                <button type="button" onClick={exportExecutionAsPdf} className="rounded-lg border border-[#C8D7F1] px-3 py-2 text-sm font-semibold text-[#1A3263]">Export as PDF</button>
              </div>
            </div>
          </div>

          {execution ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[#D7E2F5] bg-white p-4">
                  <p className="text-xs text-[#5A6E9A]">Pass rate</p>
                  <p className="text-3xl font-bold text-[#1A3263]">{execution.passRate}%</p>
                </div>
                <div className="rounded-xl border border-[#D7E2F5] bg-white p-4">
                  <p className="text-xs text-[#5A6E9A]">Completion rate</p>
                  <p className="text-3xl font-bold text-[#1A3263]">{execution.completionRate}%</p>
                </div>
                <div className="rounded-xl border border-[#D7E2F5] bg-white p-4">
                  <p className="text-xs text-[#5A6E9A]">Duration</p>
                  <p className="text-sm font-semibold text-[#1A3263]">{minutesToDuration(execution.duration)}</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">By Assignee</h3>
                  <table className="min-w-full text-sm">
                    <thead><tr className="text-[#53698F]"><th className="py-2 pr-2 text-left">Name</th><th className="py-2 pr-2 text-left">Pass</th><th className="py-2 pr-2 text-left">Fail</th><th className="py-2 pr-2 text-left">Blocked</th></tr></thead>
                    <tbody>
                      {(execution.byAssignee || []).map((row) => (
                        <tr key={row.name} className="border-t border-[#EEF2FB]"><td className="py-2 pr-2">{row.name}</td><td className="py-2 pr-2">{row.pass}</td><td className="py-2 pr-2">{row.fail}</td><td className="py-2 pr-2">{row.blocked}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">By Suite</h3>
                  <table className="min-w-full text-sm">
                    <thead><tr className="text-[#53698F]"><th className="py-2 pr-2 text-left">Suite</th><th className="py-2 pr-2 text-left">Pass</th><th className="py-2 pr-2 text-left">Fail</th><th className="py-2 pr-2 text-left">Blocked</th></tr></thead>
                    <tbody>
                      {(execution.bySuite || []).map((row) => (
                        <tr key={row.suiteName} className="border-t border-[#EEF2FB]"><td className="py-2 pr-2">{row.suiteName}</td><td className="py-2 pr-2">{row.pass}</td><td className="py-2 pr-2">{row.fail}</td><td className="py-2 pr-2">{row.blocked}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[#D7E2F5] bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-[#1A3263]">Failed Test Cases</h3>
                <div className="space-y-2">
                  {(execution.failedCases || []).map((item) => (
                    <div key={item.id} className="rounded border border-[#EEF2FB] bg-[#FAFCFF] p-3">
                      <p className="text-sm font-semibold text-[#1A3263]">{item.testCaseId} - {item.title}</p>
                      <p className="text-xs text-[#6A7FA6]">Suite: {item.suite} | Result: {item.result}</p>
                      {item.notes ? <p className="mt-1 text-sm text-[#334A75]">Notes: {item.notes}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#D7E2F5] bg-white p-4 text-sm text-[#4B5F87]">Select a run to view details.</div>
          )}
        </div>
      )}
    </div>
  )
}
