import { Link } from 'react-router-dom'
import usePlanLimits from '../hooks/usePlanLimits.js'

export default function BillingSuccessPage() {
  const { plan } = usePlanLimits()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEF2FB] px-4">
      <div className="w-full max-w-lg rounded-xl border border-[#D7E2F5] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1A3263] text-white">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-[#1A3263]">Subscription activated!</h1>
        <p className="mt-2 text-sm text-[#4B5F87]">Your plan has been upgraded to {plan}.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-[#1A3263] px-5 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
