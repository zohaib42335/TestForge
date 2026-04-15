import { createPortalSession } from '../api/billing.api.js'
import { useAuth } from '../context/AuthContext.jsx'

const LABELS = {
  projects: 'Projects',
  users: 'Team members',
  testCases: 'Test cases',
}

export default function PlanLimitModal({
  open,
  onClose,
  limitType = 'projects',
  used = 0,
  max = 0,
}) {
  const { isAdmin } = useAuth()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#C8D7F1] bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-[#1A3263]">Plan limit reached</h2>
        <p className="mt-2 text-sm text-[#4B5F87]">
          You are using {used} of {max} {LABELS[limitType] || 'items'}.
        </p>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => void createPortalSession()}
            className="mt-4 w-full rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
          >
            Upgrade plan
          </button>
        ) : (
          <p className="mt-4 text-sm text-[#6A7FA6]">Contact your admin to upgrade the plan.</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-lg border border-[#C8D7F1] px-4 py-2 text-sm text-[#1A3263] hover:bg-[#F5F8FF]"
        >
          Close
        </button>
      </div>
    </div>
  )
}
