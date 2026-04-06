/**
 * @fileoverview Parse CSV/XLSX uploads, auto-map columns, and validate rows for bulk import.
 */

import * as XLSX from 'xlsx'
import { DEFAULT_FORM_VALUES } from '../constants/testCaseFields.js'
import { validateTestCase } from './validation.js'

/** @type {string} */
export const SKIP_FIELD = '__skip__'

/**
 * Target fields available for column mapping (internal keys).
 * @type {readonly { value: string, label: string }[]}
 */
export const IMPORT_TARGET_FIELDS = [
  { value: SKIP_FIELD, label: '— Skip column —' },
  { value: 'testCaseId', label: 'Test Case ID' },
  { value: 'module', label: 'Module / Test Suite' },
  { value: 'title', label: 'Test Title' },
  { value: 'description', label: 'Description' },
  { value: 'preconditions', label: 'Pre-conditions' },
  { value: 'testSteps', label: 'Test Steps' },
  { value: 'expectedResult', label: 'Expected Result' },
  { value: 'actualResult', label: 'Actual Result' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'severity', label: 'Severity' },
  { value: 'testType', label: 'Test Type' },
  { value: 'environment', label: 'Environment' },
  { value: 'assignedTo', label: 'Assigned To' },
  { value: 'createdBy', label: 'Created By' },
  { value: 'createdDate', label: 'Created Date' },
  { value: 'executionDate', label: 'Execution Date' },
  { value: 'comments', label: 'Comments' },
  { value: 'automationStatus', label: 'Automation Status' },
  { value: 'bugId', label: 'Bug ID' },
]

/**
 * Normalizes a header string for fuzzy matching.
 * @param {string} h
 * @returns {string}
 */
export function normalizeHeaderKey(h) {
  return String(h ?? '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Map normalized alias → internal field key.
 * @type {Array<[string[], string]>}
 */
const ALIAS_GROUPS = [
  [['testcaseid', 'id', 'tcid', 'tc'], 'testCaseId'],
  [['module', 'testsuite', 'suite', 'testsuitename'], 'module'],
  [['title', 'testtitle', 'testname', 'name', 'summary'], 'title'],
  [['description', 'desc', 'details'], 'description'],
  [['preconditions', 'precondition', 'prerequisites', 'prereq'], 'preconditions'],
  [['teststeps', 'steps', 'procedure', 'actions'], 'testSteps'],
  [
    ['expectedresult', 'expected', 'expresult', 'expectedoutcome'],
    'expectedResult',
  ],
  [['actualresult', 'actual', 'actualoutcome'], 'actualResult'],
  [['status', 'state'], 'status'],
  [['priority', 'prio'], 'priority'],
  [['severity', 'sev'], 'severity'],
  [['testtype', 'type', 'category'], 'testType'],
  [['environment', 'env'], 'environment'],
  [['assignedto', 'assignee', 'owner'], 'assignedTo'],
  [['createdby', 'author', 'creator', 'reporter'], 'createdBy'],
  [['createddate', 'datecreated', 'creationdate'], 'createdDate'],
  [['executiondate', 'executed', 'rundate'], 'executionDate'],
  [['comments', 'notes', 'remark'], 'comments'],
  [['automationstatus', 'automation'], 'automationStatus'],
  [['bugid', 'bug', 'defect', 'jira', 'ticket'], 'bugId'],
]

/**
 * Returns suggested target field for a source column header, or SKIP_FIELD.
 * @param {string} header
 * @returns {string}
 */
export function suggestMappingForHeader(header) {
  const n = normalizeHeaderKey(header)
  if (!n) return SKIP_FIELD

  for (const [aliases, field] of ALIAS_GROUPS) {
    for (const a of aliases) {
      if (n === a || n.includes(a) || a.includes(n)) {
        return field
      }
    }
  }

  for (const { value } of IMPORT_TARGET_FIELDS) {
    if (value === SKIP_FIELD) continue
    const fn = normalizeHeaderKey(value)
    if (n === fn) return value
  }

  return SKIP_FIELD
}

/**
 * Builds initial mapping object: sourceHeader → targetField.
 * @param {string[]} headers
 * @returns {Record<string, string>}
 */
export function buildAutoColumnMapping(headers) {
  /** @type {Record<string, string>} */
  const map = {}
  const usedTargets = new Set()

  for (const h of headers) {
    const key = String(h)
    let suggestion = suggestMappingForHeader(key)
    if (suggestion !== SKIP_FIELD && usedTargets.has(suggestion)) {
      suggestion = SKIP_FIELD
    }
    map[key] = suggestion
    if (suggestion !== SKIP_FIELD) usedTargets.add(suggestion)
  }
  return map
}

/**
 * Parses an uploaded file into headers and row objects keyed by header.
 * @param {File} file
 * @returns {Promise<{ headers: string[], rows: Record<string, string>[] } | { error: string }>}
 */
export async function parseImportFile(file) {
  if (!file || !(file instanceof File)) {
    return { error: 'No file selected.' }
  }

  const name = file.name.toLowerCase()
  const isCsv = name.endsWith('.csv')
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')

  if (!isCsv && !isExcel) {
    return {
      error: 'Unsupported file type. Please upload a .csv, .xlsx, or .xls file.',
    }
  }

  try {
    const buf = await file.arrayBuffer()
    if (!buf || buf.byteLength === 0) {
      return { error: 'The file is empty.' }
    }

    const wb = XLSX.read(buf, {
      type: 'array',
      cellDates: true,
      raw: false,
    })

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return { error: 'The workbook contains no sheets.' }
    }

    const sheet = wb.Sheets[wb.SheetNames[0]]
    const aoa = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    })

    if (!aoa || aoa.length === 0) {
      return { error: 'No rows found in the file.' }
    }

    const headerRow = /** @type {unknown[]} */ (aoa[0])
    const headers = headerRow.map((c) =>
      c == null ? '' : String(c).trim(),
    )

    if (headers.every((h) => !h)) {
      return {
        error:
          'The first row must contain column headers. No header labels were detected.',
      }
    }

    const rows = []
    for (let r = 1; r < aoa.length; r++) {
      const line = /** @type {unknown[]} */ (aoa[r])
      /** @type {Record<string, string>} */
      const obj = {}
      let any = false
      for (let c = 0; c < headers.length; c++) {
        const key = headers[c] || `Column_${c + 1}`
        const val = line && c < line.length ? line[c] : ''
        const s =
          val instanceof Date
            ? val.toISOString().split('T')[0]
            : val == null
              ? ''
              : String(val).trim()
        obj[key] = s
        if (s) any = true
      }
      if (any) rows.push(obj)
    }

    if (rows.length === 0) {
      return {
        error:
          'No data rows found after the header row. Add at least one data row or check for merged/empty cells.',
      }
    }

    return { headers, rows }
  } catch (e) {
    console.error('[importUtils] parseImportFile', e)
    const msg =
      e && typeof e === 'object' && 'message' in e
        ? String(e.message)
        : 'Unknown parse error'
    return {
      error: `Could not read this file. It may be corrupted or password-protected. (${msg})`,
    }
  }
}

/**
 * Applies column mapping to produce one test case object per row (string values).
 * @param {Record<string, string>} row - keyed by source header
 * @param {Record<string, string>} mapping - source header → target field or SKIP
 * @returns {Record<string, string>}
 */
export function mapRowToTestCaseShape(row, mapping) {
  /** @type {Record<string, string>} */
  const out = {}
  for (const [srcHeader, target] of Object.entries(mapping)) {
    if (!target || target === SKIP_FIELD) continue
    const raw = row[srcHeader]
    out[target] = raw == null ? '' : String(raw).trim()
  }
  return out
}

/**
 * Merges mapped partial data with defaults for validation.
 * @param {Record<string, string>} partial
 * @returns {Record<string, string>}
 */
export function mergeWithDefaultsForImport(partial) {
  return {
    ...DEFAULT_FORM_VALUES,
    ...partial,
    testCaseId: '',
  }
}

/**
 * Runs validateTestCase on a merged row; returns errors or null if valid.
 * @param {Record<string, string>} merged
 * @returns {Record<string, string>|null}
 */
export function getRowValidationErrors(merged) {
  const { isValid, errors } = validateTestCase(merged)
  if (isValid) return null
  return errors
}
