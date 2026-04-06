/**
 * ImportModal — Multi-step CSV/XLSX bulk import: Upload → Map → Preview → Import.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {Function} props.onImport - ({ validRows, skipped }) => void — validRows are full merged objects passing validateTestCase
 */

import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import {
  SKIP_FIELD,
  IMPORT_TARGET_FIELDS,
  parseImportFile,
  buildAutoColumnMapping,
  mapRowToTestCaseShape,
  mergeWithDefaultsForImport,
} from '../utils/importUtils.js'
import { validateTestCase } from '../utils/validation.js'

const PREVIEW_PAGE_SIZE = 10

/** Step labels for the import wizard (shown as pills). */
const STEP_LABELS = ['Upload', 'Map columns', 'Preview', 'Done']

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {Function} props.onImport
 */
export default function ImportModal({ open, onClose, onImport }) {
  const [step, setStep] = useState(1)
  const [parseError, setParseError] = useState(/** @type {string|null} */ (null))
  const [fileLabel, setFileLabel] = useState('')
  const [headers, setHeaders] = useState(/** @type {string[]} */ ([]))
  const [rows, setRows] = useState(/** @type {Record<string, string>[]} */ ([]))
  const [columnMapping, setColumnMapping] = useState(
    /** @type {Record<string, string>} */ ({}),
  )
  const [previewPage, setPreviewPage] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [summary, setSummary] = useState(
    /** @type {{ imported: number, skipped: number } | null} */ (null),
  )

  const resetState = useCallback(() => {
    setStep(1)
    setParseError(null)
    setFileLabel('')
    setHeaders([])
    setRows([])
    setColumnMapping({})
    setPreviewPage(0)
    setDragOver(false)
    setSummary(null)
  }, [])

  useLayoutEffect(() => {
    if (open) {
      resetState()
    }
  }, [open, resetState])

  /**
   * @param {File|null} file
   */
  const processFile = async (file) => {
    setParseError(null)
    if (!file) {
      setParseError('No file selected.')
      return
    }
    setFileLabel(file.name)
    const result = await parseImportFile(file)
    if ('error' in result) {
      setParseError(result.error)
      return
    }
    setHeaders(result.headers)
    setRows(result.rows)
    setColumnMapping(buildAutoColumnMapping(result.headers))
    setPreviewPage(0)
    setStep(2)
  }

  /**
   * @param {import('react').DragEvent} e
   */
  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files && e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  /**
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  const onFileInput = (e) => {
    const f = e.target.files && e.target.files[0]
    processFile(f)
  }

  /**
   * @param {string} header
   * @param {string} target
   */
  const updateMapping = (header, target) => {
    setColumnMapping((prev) => ({ ...prev, [header]: target }))
  }

  const rowAnalyses = useMemo(() => {
    return rows.map((row) => {
      const partial = mapRowToTestCaseShape(row, columnMapping)
      const merged = mergeWithDefaultsForImport(partial)
      const { isValid, errors } = validateTestCase(merged)
      return { merged, isValid, errors }
    })
  }, [rows, columnMapping])

  const stats = useMemo(() => {
    let valid = 0
    let invalid = 0
    for (const r of rowAnalyses) {
      if (r.isValid) valid += 1
      else invalid += 1
    }
    return { valid, invalid, total: rows.length }
  }, [rowAnalyses, rows.length])

  const previewSlice = useMemo(() => {
    const start = previewPage * PREVIEW_PAGE_SIZE
    return rowAnalyses.slice(start, start + PREVIEW_PAGE_SIZE).map((r, i) => ({
      ...r,
      globalIndex: start + i,
    }))
  }, [rowAnalyses, previewPage])

  const previewPageCount = Math.max(1, Math.ceil(rows.length / PREVIEW_PAGE_SIZE))

  const handleRunImport = () => {
    const validMerged = rowAnalyses.filter((r) => r.isValid).map((r) => r.merged)
    const skipped = stats.invalid
    if (typeof onImport === 'function') {
      onImport({ validRows: validMerged, skipped })
    }
    setSummary({ imported: validMerged.length, skipped })
    setStep(4)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="bg-white border border-orange-200 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-orange-500 text-white shrink-0">
          <div>
            <h2 id="import-modal-title" className="text-lg font-semibold">
              Import test cases
            </h2>
            <p className="text-xs text-orange-100 font-mono mt-1">
              Step {step} of 4 — {fileLabel && `"${fileLabel}"`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-lg text-white hover:text-orange-100 transition"
            aria-label="Close import"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 text-stone-900">
          <div
            className="flex flex-wrap gap-2 mb-5"
            role="list"
            aria-label="Import steps"
          >
            {STEP_LABELS.map((label, i) => {
              const n = i + 1
              const isActive = step === n
              const isDone = step > n
              return (
                <span
                  key={label}
                  role="listitem"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : isDone
                        ? 'bg-orange-200 text-orange-700'
                        : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {n}. {label}
                </span>
              )
            })}
          </div>
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">
                Upload a <strong className="text-stone-800">.csv</strong>,{' '}
                <strong className="text-stone-800">.xlsx</strong>, or{' '}
                <strong className="text-stone-800">.xls</strong> file. The first row must
                contain column headers.
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition bg-orange-50/50 ${
                  dragOver
                    ? 'border-orange-500 bg-orange-100'
                    : 'border-orange-300'
                }`}
              >
                <p className="text-stone-700 mb-4">
                  Drag and drop your file here, or use the button below.
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    className="hidden"
                    onChange={onFileInput}
                  />
                  <span className="cursor-pointer px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition inline-block">
                    Browse files
                  </span>
                </label>
              </div>
              {parseError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 border-l-4 border-l-red-500 text-red-800 text-sm px-4 py-3"
                  role="alert"
                >
                  {parseError}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">
                Map each column from your file to a field in TestForge. Unmapped columns
                are skipped. You can override any auto-detected mapping.
              </p>
              <div className="overflow-x-auto rounded-lg border border-orange-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-orange-500 text-xs uppercase tracking-wider text-white font-mono">
                    <tr>
                      <th className="px-4 py-3 border-b border-orange-200">Source column</th>
                      <th className="px-4 py-3 border-b border-orange-200">Maps to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((h) => (
                      <tr
                        key={h}
                        className="border-t border-orange-200 odd:bg-white even:bg-orange-50 text-stone-800"
                      >
                        <td className="px-4 py-2 font-mono text-xs break-all">{h}</td>
                        <td className="px-4 py-2">
                          <select
                            value={columnMapping[h] ?? SKIP_FIELD}
                            onChange={(e) => updateMapping(h, e.target.value)}
                            className="w-full max-w-md bg-white border border-orange-300 text-stone-900 rounded-lg px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
                          >
                            {IMPORT_TARGET_FIELDS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parseError && (
                <p className="text-red-600 text-sm" role="alert">
                  {parseError}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-stone-700">
                  Total rows: <strong>{stats.total}</strong>
                </span>
                <span className="text-green-600">
                  Valid: <strong>{stats.valid}</strong>
                </span>
                <span className="text-red-600">
                  With errors: <strong>{stats.invalid}</strong>
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Rows failing validation (missing required fields or invalid enums) are
                highlighted. Only valid rows will be imported.
              </p>
              <div className="overflow-x-auto rounded-lg border border-orange-200 max-h-[360px] overflow-y-auto">
                <table className="w-full text-xs text-left min-w-[720px]">
                  <thead className="sticky top-0 bg-orange-500 z-10 text-[10px] uppercase tracking-wider text-white font-mono">
                    <tr>
                      <th className="px-2 py-2 w-10 border-b border-orange-200">#</th>
                      <th className="px-2 py-2 border-b border-orange-200">Module</th>
                      <th className="px-2 py-2 border-b border-orange-200">Title</th>
                      <th className="px-2 py-2 border-b border-orange-200">Status</th>
                      <th className="px-2 py-2 border-b border-orange-200">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSlice.map(({ merged, isValid, errors, globalIndex }) => (
                      <tr
                        key={globalIndex}
                        className={`border-t border-orange-200 ${
                          isValid
                            ? 'odd:bg-white even:bg-orange-50'
                            : 'border border-red-400 bg-red-50'
                        }`}
                      >
                        <td className="px-2 py-2 text-stone-500">{globalIndex + 1}</td>
                        <td className="px-2 py-2 text-stone-800 max-w-[120px] truncate">
                          {merged.module}
                        </td>
                        <td className="px-2 py-2 text-stone-800 max-w-[200px] truncate">
                          {merged.title}
                        </td>
                        <td className="px-2 py-2 text-stone-800">{merged.status}</td>
                        <td className="px-2 py-2 text-red-700">
                          {isValid
                            ? '—'
                            : Object.values(errors || {}).slice(0, 2).join(' · ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > PREVIEW_PAGE_SIZE && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <button
                    type="button"
                    disabled={previewPage <= 0}
                    onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 rounded-lg bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-stone-500">
                    Page {previewPage + 1} / {previewPageCount}
                  </span>
                  <button
                    type="button"
                    disabled={previewPage >= previewPageCount - 1}
                    onClick={() =>
                      setPreviewPage((p) => Math.min(previewPageCount - 1, p + 1))
                    }
                    className="px-3 py-1 rounded-lg bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 4 && summary && (
            <div className="text-center py-8 space-y-4">
              <p className="text-4xl text-green-600" aria-hidden>
                ✓
              </p>
              <p className="text-lg text-stone-900 font-semibold">Import complete</p>
              <p className="text-stone-500 text-sm">
                {summary.imported} test case{summary.imported === 1 ? '' : 's'} imported
                successfully{summary.skipped > 0 ? `, ${summary.skipped} skipped due to errors` : ''}.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-orange-200 bg-orange-50/30 flex flex-wrap justify-end gap-2 shrink-0">
          {step === 1 && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-orange-600 text-sm font-semibold hover:bg-orange-50"
            >
              Cancel
            </button>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-stone-700 text-sm hover:bg-orange-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold"
              >
                Continue to preview
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-stone-700 text-sm hover:bg-orange-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-orange-600 text-sm hover:bg-orange-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={stats.valid === 0}
                onClick={handleRunImport}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:bg-orange-200 disabled:text-orange-400 disabled:cursor-not-allowed"
              >
                Import valid rows only
              </button>
            </>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
