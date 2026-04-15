import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createSuite as createSuiteApi,
  deleteSuite as deleteSuiteApi,
  getSuites as getSuitesApi,
  updateSuite as updateSuiteApi,
} from '../api/testSuites.api.js'

export function useTestSuites(projectId) {
  const [suites, setSuites] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const data = await getSuitesApi(projectId)
      setSuites(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load suites.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const createSuite = useCallback(async (payload) => {
    const data = await createSuiteApi(projectId, payload)
    await refetch()
    return data
  }, [projectId, refetch])

  const updateSuite = useCallback(async (suiteId, payload) => {
    const data = await updateSuiteApi(suiteId, payload)
    await refetch()
    return data
  }, [refetch])

  const deleteSuite = useCallback(async (suiteId) => {
    const data = await deleteSuiteApi(suiteId)
    await refetch()
    return data
  }, [refetch])

  return useMemo(() => ({
    suites,
    loading,
    error,
    refetch,
    createSuite,
    updateSuite,
    deleteSuite,
  }), [suites, loading, error, refetch, createSuite, updateSuite, deleteSuite])
}
