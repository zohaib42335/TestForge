/**
 * @fileoverview Excel export for test case lists using SheetJS (`xlsx`).
 */

import * as XLSX from 'xlsx'

/**
 * Ordered column definitions: internal field key, display header, default column width (characters).
 * @type {ReadonlyArray<{ key: string, header: string, wch: number }>}
 */
const COLUMN_DEFS = [
  { key: 'testCaseId', header: 'Test Case ID', wch: 14 },
  { key: 'module', header: 'Module/Suite', wch: 22 },
  { key: 'title', header: 'Title', wch: 36 },
  { key: 'description', header: 'Description', wch: 40 },
  { key: 'preconditions', header: 'Preconditions', wch: 32 },
  { key: 'testSteps', header: 'Test Steps', wch: 48 },
  { key: 'expectedResult', header: 'Expected Result', wch: 36 },
  { key: 'actualResult', header: 'Actual Result', wch: 36 },
  { key: 'status', header: 'Status', wch: 16 },
  { key: 'priority', header: 'Priority', wch: 12 },
  { key: 'severity', header: 'Severity', wch: 14 },
  { key: 'testType', header: 'Test Type', wch: 18 },
  { key: 'environment', header: 'Environment', wch: 16 },
  { key: 'assignedTo', header: 'Assigned To', wch: 20 },
  { key: 'createdBy', header: 'Created By', wch: 20 },
  { key: 'createdDate', header: 'Created Date', wch: 14 },
  { key: 'executionDate', header: 'Execution Date', wch: 16 },
  { key: 'comments', header: 'Comments', wch: 36 },
  { key: 'automationStatus', header: 'Automation Status', wch: 22 },
  { key: 'bugId', header: 'Bug ID', wch: 14 },
]

/**
 * Converts a test case object to a display string for a cell.
 * @param {unknown} value
 * @returns {string}
 */
function cellValue(value) {
  if (value == null) return ''
  return String(value)
}

/**
 * Builds a 2D array (headers + data) from test cases.
 * @param {Array<object>} testCases
 * @returns {string[][]}
 */
function buildAoA(testCases) {
  const headers = COLUMN_DEFS.map((c) => c.header)
  const rows = testCases.map((tc) =>
    COLUMN_DEFS.map((c) => cellValue(tc && typeof tc === 'object' ? tc[c.key] : '')),
  )
  return [headers, ...rows]
}

/**
 * Computes per-column character widths (`wch`) from header + cell strings (clamped).
 * @param {string[][]} aoa
 * @returns {Array<{ wch: number }>}
 */
function computeWscols(aoa) {
  const colCount = COLUMN_DEFS.length
  /** @type {Array<{ wch: number }>} */
  const cols = []
  for (let c = 0; c < colCount; c++) {
    const defWch = COLUMN_DEFS[c].wch
    let maxLen = COLUMN_DEFS[c].header.length
    for (let r = 0; r < aoa.length; r++) {
      const row = aoa[r]
      const cell = row && row[c] != null ? String(row[c]) : ''
      if (cell.length > maxLen) maxLen = cell.length
    }
    const wch = Math.min(Math.max(maxLen + 2, 10), 60)
    cols.push({ wch: Math.max(wch, defWch) })
  }
  return cols
}

/**
 * Exports an array of test cases to a downloadable .xlsx file.
 * @param {Array} testCases - Array of test case objects
 * @param {string} [filename='TestCases.xlsx'] - Output filename
 * @returns {void}
 */
export function exportToExcel(testCases, filename = 'TestCases.xlsx') {
  try {
    if (!Array.isArray(testCases) || testCases.length === 0) {
      alert('No test cases to export')
      return
    }

    const aoa = buildAoA(testCases)
    const worksheet = XLSX.utils.aoa_to_sheet(aoa)

    worksheet['!cols'] = computeWscols(aoa)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases')
    XLSX.writeFile(workbook, filename)
  } catch (err) {
    console.error('[qa-test-case-manager] exportToExcel failed:', err)
    const msg =
      err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
        ? err.message
        : 'Unknown error'
    alert(`Export failed: ${msg}`)
  }
}
