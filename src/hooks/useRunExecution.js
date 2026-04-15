import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRun as getRunApi, updateRunResult as updateRunResultApi } from '../api/testRuns.api.js'

function buildStats(results) {
  const total = results.length
  const passCount = results.filter((r) => r.result === 'PASS').length
  const failCount = results.filter((r) => r.result === 'FAIL').length
  const blockedCount = results.filter((r) => r.result === 'BLOCKED').length
  const skippedCount = results.filter((r) => r.result === 'SKIPPED').length
  const notRunCount = results.filter((r) => r.result === 'NOT_RUN').length
  const done = passCount + failCount + blockedCount + skippedCount
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0
  return { total, passCount, failCount, blockedCount, skippedCount, notRunCount, done, passRate }
}

export function useRunExecution(projectId, runId) {
  const [run, setRun] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    if (!projectId || !runId) return
    setLoading(true)
    setError('')
    try {
      const data = await getRunApi(projectId, runId)
      setRun(data)
      setResults(Array.isArray(data?.results) ? data.results : [])
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load run.')
    } finally {
      setLoading(false)
    }
  }, [projectId, runId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const updateResult = useCallback(async (resultId, payload) => {
    const prev = results
    const now = new Date().toISOString()
    setResults((current) =>
      current.map((row) =>
        row.id === resultId
          ? {
              ...row,
              result: payload.result,
              notes: payload.notes ?? row.notes,
              executedAt: now,
            }
          : row,
      ),
    )
    try {
      await updateRunResultApi(projectId, runId, resultId, payload)
    } catch (err) {
      setResults(prev)
      throw err
    }
  }, [projectId, runId, results])

  const computedStats = useMemo(() => buildStats(results), [results])

  return { run, results, loading, error, refetch, updateResult, computedStats }
}
