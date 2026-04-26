import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createRun as createRunApi,
  deleteRun as deleteRunApi,
  getRuns as getRunsApi,
  startRun as startRunApi,
} from '../api/testRuns.api.js'

export function useTestRuns(projectId, initialParams = { page: 1, limit: 20 }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [params, setParams] = useState(initialParams)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const paramsRef = useRef(params)

  const mergeParams = useCallback((base, override = {}) => {
    const merged = { ...base, ...override }
    let changed = false
    for (const key of Object.keys(merged)) {
      if (base[key] !== merged[key]) {
        changed = true
        break
      }
    }
    return { merged, changed }
  }, [])

  const refetch = useCallback(async (override = {}) => {
    if (!projectId) return
    setLoading(true)
    setError('')
    const { merged: next } = mergeParams(paramsRef.current, override)
    try {
      const data = await getRunsApi(projectId, next)
      setRuns(Array.isArray(data?.items) ? data.items : [])
      setTotal(Number(data?.total || 0))
      setTotalPages(Number(data?.totalPages || 1))
      setParams((prev) => {
        const { merged, changed } = mergeParams(prev, override)
        if (!changed) return prev
        paramsRef.current = merged
        return merged
      })
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load test runs.')
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [projectId, mergeParams])

  useEffect(() => {
    paramsRef.current = params
  }, [params])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const createRun = useCallback(async (payload) => {
    const data = await createRunApi(projectId, payload)
    await refetch()
    return data
  }, [projectId, refetch])

  const startRun = useCallback(async (runId) => {
    const data = await startRunApi(projectId, runId)
    await refetch()
    return data
  }, [projectId, refetch])

  const deleteRun = useCallback(async (runId) => {
    const data = await deleteRunApi(projectId, runId)
    await refetch()
    return data
  }, [projectId, refetch])

  return useMemo(() => ({
    runs,
    loading,
    error,
    refetch,
    total,
    totalPages,
    page: params.page || 1,
    createRun,
    startRun,
    deleteRun,
  }), [runs, loading, error, refetch, total, totalPages, params.page, createRun, startRun, deleteRun])
}
