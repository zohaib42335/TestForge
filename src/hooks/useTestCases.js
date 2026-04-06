/**
 * @fileoverview State hook for test cases: CRUD, persistence, IDs, sync, export.
 */

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_FORM_VALUES } from '../constants/testCaseFields.js'
import { exportToExcel } from '../utils/excelExport.js'
import { syncToGoogleSheets } from '../utils/googleSheets.js'
import {
  clearLocalStorage,
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../utils/localStorage.js'
import { validateTestCase } from '../utils/validation.js'

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
 * useTestCases — manages all test case state, CRUD operations,
 * localStorage persistence, ID generation, and sync status.
 * @returns {Object} state and action handlers
 */
export function useTestCases() {
  const [testCases, setTestCases] = useState([])
  const [hasHydrated, setHasHydrated] = useState(false)

  const [syncStatus, setSyncStatus] = useState({
    loading: false,
    success: false,
    error: false,
    message: '',
  })

  useEffect(() => {
    setTestCases(loadFromLocalStorage())
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    saveToLocalStorage(testCases)
  }, [testCases, hasHydrated])

  const addTestCase = useCallback((formData) => {
    const { isValid, errors } = validateTestCase(formData)
    if (!isValid) {
      return { success: false, errors }
    }

    setTestCases((prev) => {
      const id = generateNextTestCaseId(prev)
      const row = buildNewTestCase(formData, id)
      return [...prev, row]
    })

    return { success: true, errors: {} }
  }, [])

  const updateTestCase = useCallback((id, updatedData) => {
    /** @type {{ success: boolean, errors: Record<string, string> }} */
    let result = {
      success: false,
      errors: { testCaseId: 'Test case not found.' },
    }

    setTestCases((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const idx = list.findIndex(
        (tc) => tc && String(tc.testCaseId) === String(id),
      )
      if (idx === -1) {
        result = {
          success: false,
          errors: { testCaseId: 'Test case not found.' },
        }
        return prev
      }

      const merged = { ...list[idx], ...updatedData }
      const v = validateTestCase(merged)
      if (!v.isValid) {
        result = { success: false, errors: v.errors }
        return prev
      }

      const next = [...list]
      next[idx] = merged
      result = { success: true, errors: {} }
      return next
    })

    return result
  }, [])

  const deleteTestCase = useCallback((id) => {
    setTestCases((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (tc) => !tc || String(tc.testCaseId) !== String(id),
      ),
    )
  }, [])

  const syncToSheets = useCallback(async (accessToken) => {
    setSyncStatus({
      loading: true,
      success: false,
      error: false,
      message: '',
    })

    const result = await syncToGoogleSheets(testCases, accessToken ?? null)

    const ok = result && result.success === true
    setSyncStatus({
      loading: false,
      success: ok,
      error: !ok,
      message:
        result && typeof result.message === 'string' ? result.message : '',
    })

    return result
  }, [testCases])

  const exportExcel = useCallback(() => {
    exportToExcel(testCases)
  }, [testCases])

  const clearAll = useCallback(() => {
    setTestCases([])
    clearLocalStorage()
    setSyncStatus({
      loading: false,
      success: false,
      error: false,
      message: '',
    })
  }, [])

  const resetSyncStatus = useCallback(() => {
    setSyncStatus({
      loading: false,
      success: false,
      error: false,
      message: '',
    })
  }, [])

  /**
   * Appends multiple validated test case payloads with fresh sequential TC-### IDs.
   * @param {Array<Record<string, string>>} validMergedRows - Full row objects that already pass validateTestCase
   * @returns {{ success: boolean, imported: number, message: string }}
   */
  const importValidatedTestCases = useCallback((validMergedRows) => {
    if (!Array.isArray(validMergedRows) || validMergedRows.length === 0) {
      return {
        success: false,
        imported: 0,
        message: 'No valid rows to import.',
      }
    }

    setTestCases((prev) => {
      const list = Array.isArray(prev) ? [...prev] : []
      let max = 0
      for (const tc of list) {
        const raw = tc && tc.testCaseId != null ? String(tc.testCaseId).trim() : ''
        const m = /^TC-(\d+)$/i.exec(raw)
        if (m) {
          const n = parseInt(m[1], 10)
          if (!Number.isNaN(n)) max = Math.max(max, n)
        }
      }
      for (const data of validMergedRows) {
        max += 1
        const id = `TC-${String(max).padStart(3, '0')}`
        list.push(buildNewTestCase(data, id))
      }
      return list
    })

    return {
      success: true,
      imported: validMergedRows.length,
      message: `${validMergedRows.length} test case(s) imported.`,
    }
  }, [])

  return {
    testCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    syncStatus,
    resetSyncStatus,
    syncToSheets,
    exportExcel,
    clearAll,
    importValidatedTestCases,
  }
}
