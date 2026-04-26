import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  approveTestCase as approveTestCaseApi,
  bulkUpdateStatus as bulkUpdateStatusApi,
  createTestCase as createTestCaseApi,
  deleteTestCase as deleteTestCaseApi,
  duplicateTestCase as duplicateTestCaseApi,
  exportTestCases as exportTestCasesApi,
  getTestCase as getTestCaseApi,
  getTestCases as getTestCasesApi,
  importTestCases as importTestCasesApi,
  updateTestCase as updateTestCaseApi,
} from '../api/testCases.api.js'

/**
 * Computes the next `TC-###` id from existing test cases (3-digit zero padding).
 * @param {Array<{ testCaseId?: string }>} testCases
 * @returns {string}
 */
function generateNextTestCaseId(testCases) {
  let max = 0
  const list = Array.isArray(testCases) ? testCases : []
  for (const tc of list) {
    const raw = tc && tc.testCaseId != null ? String(tc.testCaseId).trim() : ''
    const m = /^TC-(\d+)$/i.exec(raw)
    if (m) {
      const n = parseInt(m[1], 10)
      if (!Number.isNaN(n)) max = Math.max(max, n)
    }
  }
  const next = max + 1
  return `TC-${String(next).padStart(3, '0')}`
}

/**
 * Shallow clone of defaults merged with partial data for a new test case.
 * @param {object} formData
 * @param {string} testCaseId
 * @returns {object}
 */
function buildNewTestCase(formData, testCaseId) {
  return {
    ...DEFAULT_FORM_VALUES,
    ...formData,
    testCaseId,
  }
}

/**
 * useTestCases — manages test case state for Step 3.
 *
 * API read:
 * - Fetches project test cases with server pagination.
 *
 * API write:
 * - `createTestCase(formData)` validates and posts to REST API.
 *
 * @returns {{
 *   testCases: Array<object>,
 *   loading: boolean,
 *   error: string,
 *   isSubmitting: boolean,
 *   addTestCase: (formData: Record<string, string>) => Promise<{ success: boolean, errors?: Record<string, string>, error?: string }>,
 *   updateTestCase: (id: string, updatedData: Record<string, string>) => { success: boolean, errors: Record<string, string> },
 *   deleteTestCase: (id: string) => void,
 *   syncStatus: { loading: boolean, success: boolean, error: boolean, message: string },
 *   resetSyncStatus: () => void,
 *   syncToSheets: (accessToken: string | null) => Promise<any>,
 *   exportExcel: () => void,
 *   clearAll: () => void,
 *   importValidatedTestCases: (validMergedRows: Array<Record<string, string>>) => { success: boolean, imported: number, message: string },
 * }}
 */
export function useTestCases(projectId, initialFilters = {}) {
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  })
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const filtersRef = useRef(filters)

  const mergeFilters = useCallback((base, override = {}) => {
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
    const { merged: params } = mergeFilters(filtersRef.current, override)
    setLoading(true)
    setError('')
    try {
      const data = await getTestCasesApi(projectId, params)
      setTestCases(Array.isArray(data?.items) ? data.items : [])
      setTotal(Number(data?.total || 0))
      setTotalPages(Number(data?.totalPages || 1))
      setFilters((prev) => {
        const { merged, changed } = mergeFilters(prev, override)
        if (!changed) return prev
        filtersRef.current = merged
        return merged
      })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load test cases')
    } finally {
      setLoading(false)
    }
  }, [projectId, mergeFilters])

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const createTestCase = useCallback(async (payload) => {
    const data = await createTestCaseApi(projectId, payload)
    await refetch()
    return data
  }, [projectId, refetch])

  const updateTestCase = useCallback(async (id, payload) => {
    const data = await updateTestCaseApi(projectId, id, payload)
    await refetch()
    return data
  }, [projectId, refetch])

  const deleteTestCase = useCallback(async (id) => {
    const data = await deleteTestCaseApi(projectId, id)
    await refetch()
    return data
  }, [projectId, refetch])

  const duplicateTestCase = useCallback(async (id) => {
    const data = await duplicateTestCaseApi(projectId, id)
    await refetch()
    return data
  }, [projectId, refetch])

  const bulkUpdateStatus = useCallback(async (ids, status) => {
    const data = await bulkUpdateStatusApi(projectId, ids, status)
    await refetch()
    return data
  }, [projectId, refetch])

  const approveTestCase = useCallback(async (id) => {
    const data = await approveTestCaseApi(projectId, id)
    await refetch()
    return data
  }, [projectId, refetch])

  const importTestCases = useCallback(async (rows) => {
    const data = await importTestCasesApi(projectId, rows)
    await refetch()
    return data
  }, [projectId, refetch])

  const exportTestCases = useCallback(async () => {
    return exportTestCasesApi(projectId)
  }, [projectId])

  const getTestCase = useCallback(async (id) => {
    return getTestCaseApi(projectId, id)
  }, [projectId])

  const setPage = useCallback((page) => {
    void refetch({ page })
  }, [refetch])

  const setSort = useCallback((sortBy, sortOrder) => {
    void refetch({ sortBy, sortOrder, page: 1 })
  }, [refetch])

  const applyFilters = useCallback((next) => {
    void refetch({ ...next, page: 1 })
  }, [refetch])

  const state = useMemo(() => ({
    testCases,
    loading,
    error,
    refetch,
    total,
    page: filters.page,
    totalPages,
    filters,
    setPage,
    setSort,
    applyFilters,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    duplicateTestCase,
    bulkUpdateStatus,
    approveTestCase,
    importTestCases,
    exportTestCases,
    getTestCase,
  }), [
    testCases,
    loading,
    error,
    refetch,
    total,
    filters.page,
    totalPages,
    filters,
    setPage,
    setSort,
    applyFilters,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    duplicateTestCase,
    bulkUpdateStatus,
    approveTestCase,
    importTestCases,
    exportTestCases,
    getTestCase,
  ])

  return state
}
