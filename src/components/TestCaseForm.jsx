import { useMemo, useState } from 'react'

const DEFAULT_FORM = {
  testCaseId: '',
  title: '',
  module: '',
  description: '',
  preConditions: '',
  expectedResult: '',
  testType: 'FUNCTIONAL',
  priority: 'HIGH',
  severity: 'MAJOR',
  assignedToId: '',
  suiteId: '',
  tags: '',
  testSteps: [{ step: '', expected: '' }],
}

/**
 * Rich test case form for create/edit flows.
 *
 * @param {{ initialValues?: Record<string, any>, suites?: Array<Record<string, any>>, members?: Array<Record<string, any>>, mode?: 'create'|'edit', onCancel?: () => void, onSubmit: (payload: Record<string, any>) => Promise<void>|void, isSubmitting?: boolean }} props
 * @returns {import('react').ReactNode}
 */
export default function TestCaseForm({
  initialValues = {},
  suites = [],
  members = [],
  mode = 'create',
  onCancel,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...initialValues,
    tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : initialValues.tags || '',
    testSteps: Array.isArray(initialValues.testSteps) && initialValues.testSteps.length > 0
      ? initialValues.testSteps
      : DEFAULT_FORM.testSteps,
  })
  const [errors, setErrors] = useState({})

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.testSteps.some((row) => row.step.trim().length > 0)
  }, [form])

  /**
   * @param {string} key
   * @param {any} value
   */
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * @param {number} idx
   * @param {'step'|'expected'} key
   * @param {string} value
   */
  const setStep = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      testSteps: prev.testSteps.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    }))
  }

  const addStep = () => setForm((prev) => ({ ...prev, testSteps: [...prev.testSteps, { step: '', expected: '' }] }))
  const removeStep = (idx) => setForm((prev) => ({ ...prev, testSteps: prev.testSteps.filter((_, i) => i !== idx) }))

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.testSteps.some((row) => row.step.trim())) nextErrors.testSteps = 'At least one step is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await onSubmit({
      ...form,
      tags: String(form.tags || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      testSteps: form.testSteps.map((row, i) => ({ order: i + 1, action: row.step, expectedResult: row.expected })),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-[#D7E2F5] bg-white p-5">
      <h3 className="text-lg font-semibold text-[#1A3263]">
        {mode === 'edit' ? 'Edit Test Case' : 'New Test Case'}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-[#1A3263]">
          Test Case ID
          <input
            readOnly
            value={form.testCaseId || 'Auto-generated'}
            className="mt-1 w-full rounded border border-[#D6E0F5] bg-[#F8FAFF] px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm text-[#1A3263]">
          Test Title
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            className="mt-1 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm"
          />
          {errors.title ? <span className="text-xs text-red-600">{errors.title}</span> : null}
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-[#1A3263]">
          Test Type
          <select value={form.testType} onChange={(e) => setField('testType', e.target.value)} className="mt-1 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm">
            {['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'INTEGRATION', 'PERFORMANCE', 'SECURITY', 'USABILITY'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#1A3263]">
          Priority
          <select value={form.priority} onChange={(e) => setField('priority', e.target.value)} className="mt-1 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm text-[#1A3263]">
          Severity
          <select value={form.severity} onChange={(e) => setField('severity', e.target.value)} className="mt-1 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm">
            {['CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-[#1A3263]">
          Suite
          <select value={form.suiteId} onChange={(e) => setField('suiteId', e.target.value)} className="mt-1 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {suites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-[#1A3263]">
          Assigned To
          <select value={form.assignedToId} onChange={(e) => setField('assignedToId', e.target.value)} className="mt-1 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm">
            <option value="">Unassigned</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.displayName || member.email}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-sm text-[#1A3263]">
        Description
        <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className="mt-1 h-24 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm" />
      </label>

      <label className="block text-sm text-[#1A3263]">
        Pre-conditions
        <textarea value={form.preConditions} onChange={(e) => setField('preConditions', e.target.value)} className="mt-1 h-24 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm" />
      </label>

      <div>
        <p className="text-sm font-medium text-[#1A3263]">Test Steps</p>
        <div className="mt-2 space-y-2">
          {form.testSteps.map((row, idx) => (
            <div key={`${idx}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input value={row.step} onChange={(e) => setStep(idx, 'step', e.target.value)} placeholder={`Step ${idx + 1}`} className="rounded border border-[#D6E0F5] px-3 py-2 text-sm" />
              <input value={row.expected} onChange={(e) => setStep(idx, 'expected', e.target.value)} placeholder="Expected outcome" className="rounded border border-[#D6E0F5] px-3 py-2 text-sm" />
              <button type="button" onClick={() => removeStep(idx)} disabled={form.testSteps.length <= 1} className="rounded border border-[#D6E0F5] px-3 py-2 text-sm text-red-600 disabled:opacity-50">
                x
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep} className="mt-2 text-sm font-medium text-[#1A3263]">+ Add Step</button>
        {errors.testSteps ? <p className="text-xs text-red-600">{errors.testSteps}</p> : null}
      </div>

      <label className="block text-sm text-[#1A3263]">
        Expected Result
        <textarea value={form.expectedResult} onChange={(e) => setField('expectedResult', e.target.value)} className="mt-1 h-24 w-full rounded border border-[#D6E0F5] px-3 py-2 text-sm" />
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => onCancel?.()} className="rounded border border-[#D6E0F5] px-4 py-2 text-sm text-[#1A3263]">
          Cancel
        </button>
        <button disabled={isSubmitting || !canSubmit} type="submit" className="rounded bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Test Case'}
        </button>
      </div>
    </form>
  )
}
