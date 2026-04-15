import { useMemo, useState } from 'react'
import PlanLimitModal from './PlanLimitModal.jsx'
import usePlanLimits from '../hooks/usePlanLimits.js'

const defaultForm = {
  title: '',
  description: '',
  preConditions: '',
  expectedResult: '',
  priority: 'MEDIUM',
  severity: 'MINOR',
  testType: 'FUNCTIONAL',
  suiteId: '',
  assignedToId: '',
  tags: '',
  testSteps: [{ step: '', expected: '' }],
}

export default function TestCaseForm({ suites = [], onSubmit, isSubmitting = false }) {
  const { isAtLimit, usage } = usePlanLimits()
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')
  const [showLimitModal, setShowLimitModal] = useState(false)

  const canSubmit = useMemo(() => {
    return form.title.trim().length >= 3 && form.testSteps.some((x) => x.step.trim() && x.expected.trim())
  }, [form])

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }))
  const updateStep = (index, key, value) =>
    setForm((p) => ({
      ...p,
      testSteps: p.testSteps.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }))

  const addStep = () => setForm((p) => ({ ...p, testSteps: [...p.testSteps, { step: '', expected: '' }] }))
  const removeStep = (index) =>
    setForm((p) => ({ ...p, testSteps: p.testSteps.filter((_, i) => i !== index) }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (isAtLimit.testCases) {
      setShowLimitModal(true)
      return
    }
    try {
      await onSubmit({
        ...form,
        tags: form.tags
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        suiteId: form.suiteId || undefined,
        assignedToId: form.assignedToId || undefined,
      })
      setForm(defaultForm)
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create test case.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#B0C0E0] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#1A3263]">Create Test Case</h3>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <input className="w-full rounded border px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => update('title', e.target.value)} />
      <textarea className="w-full rounded border px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
      <select className="w-full rounded border px-3 py-2" value={form.suiteId} onChange={(e) => update('suiteId', e.target.value)}>
        <option value="">No Suite</option>
        {suites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name}</option>)}
      </select>
      {form.testSteps.map((row, index) => (
        <div key={`${index}`} className="grid grid-cols-2 gap-2">
          <input className="rounded border px-2 py-1" placeholder={`Step ${index + 1}`} value={row.step} onChange={(e) => updateStep(index, 'step', e.target.value)} />
          <div className="flex gap-2">
            <input className="w-full rounded border px-2 py-1" placeholder="Expected" value={row.expected} onChange={(e) => updateStep(index, 'expected', e.target.value)} />
            {form.testSteps.length > 1 ? <button type="button" onClick={() => removeStep(index)}>x</button> : null}
          </div>
        </div>
      ))}
      <button type="button" className="text-sm text-[#1A3263]" onClick={addStep}>+ Add Step</button>
      <button disabled={isSubmitting || !canSubmit} className="w-full rounded bg-[#1A3263] py-2 text-white disabled:opacity-50" type="submit">
        {isSubmitting ? 'Saving...' : 'Create test case'}
      </button>
      <PlanLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="testCases"
        used={usage.testCases.used}
        max={usage.testCases.max}
      />
    </form>
  )
}
