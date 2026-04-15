import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import usePlanLimits from '../hooks/usePlanLimits.js'

function percent(used, max) {
  if (!max || max <= 0) return 0
  return Math.round((used / max) * 100)
}

export default function UsageBanner({ onUpgrade }) {
  const { isAdmin } = useAuth()
  const { usage } = usePlanLimits()

  const warning = useMemo(() => {
    if (!usage) return null
    const entries = [
      { key: 'projects', ...usage.projects },
      { key: 'users', ...usage.users },
      { key: 'test cases', ...usage.testCases },
    ]

    const target = entries.find((item) => percent(item.used, item.max) >= 80)
    if (!target) return null
    return target
  }, [usage])

  if (!warning) return null

  return (
    <div className="mx-auto mt-2 w-full max-w-7xl rounded-lg border border-[#BBD0F5] bg-[#EEF3FF] px-4 py-3 text-[#1A3263] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          You are using <strong>{warning.used}</strong> of <strong>{warning.max}</strong> {warning.key}.
          Upgrade your plan for more.
        </p>
        {isAdmin ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="rounded-md bg-[#1A3263] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#122247]"
          >
            Upgrade Plan
          </button>
        ) : null}
      </div>
    </div>
  )
}
