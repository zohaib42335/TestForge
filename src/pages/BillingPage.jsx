import { useMemo, useState } from 'react'
import { createCheckoutSession, createPortalSession } from '../api/billing.api.js'
import usePlanLimits from '../hooks/usePlanLimits.js'
import { useAuth } from '../context/AuthContext.jsx'

function progressClass(percent) {
  if (percent >= 100) return 'bg-red-500'
  if (percent >= 80) return 'bg-amber-500'
  return 'bg-[#1A3263]'
}

function UsageRow({ label, used, max }) {
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-[#334A75]">
        <span>{label}</span>
        <span>{used} / {max}</span>
      </div>
      <div className="h-2 rounded bg-[#E6ECFA]">
        <div className={`h-2 rounded ${progressClass(percent)}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { isAdmin } = useAuth()
  const { loading, plan, subscriptionStatus, usage, limits, nextBillingDate } = usePlanLimits()
  const [busyPlan, setBusyPlan] = useState('')

  const cards = useMemo(
    () => [
      {
        key: 'FREE',
        title: 'FREE',
        features: ['1 project', '3 users', '50 test cases', 'Core features only'],
      },
      {
        key: 'STARTER',
        title: 'STARTER',
        features: [
          '5 projects',
          '10 users',
          '500 test cases',
          'Google Sheets sync',
          'Excel import/export',
          'Template library',
          'Email notifications',
        ],
      },
      {
        key: 'PROFESSIONAL',
        title: 'PROFESSIONAL',
        popular: true,
        features: [
          '20 projects',
          '50 users',
          'Unlimited test cases',
          'Everything in Starter',
          'Activity log & audit trail',
          'Advanced reports',
          'Screenshot attachments',
          'Bug reporting',
        ],
      },
    ],
    [],
  )

  if (!isAdmin) {
    return <div className="mx-auto w-full max-w-7xl px-4 py-6 text-[#4B5F87]">Only admins can access billing.</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <div className="rounded-xl border border-[#D7E2F5] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1A3263]">Billing</h1>
        {loading ? (
          <p className="mt-2 text-sm text-[#4B5F87]">Loading subscription...</p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#4B5F87]">Current Plan</p>
              <p className="text-xl font-semibold text-[#1A3263]">{plan}</p>
              <span className="mt-1 inline-flex rounded-full bg-[#EEF2FB] px-2 py-1 text-xs font-semibold text-[#1A3263]">
                {String(subscriptionStatus || 'ACTIVE').replace('_', ' ')}
              </span>
              {nextBillingDate ? (
                <p className="mt-2 text-sm text-[#4B5F87]">
                  Next billing: {new Date(nextBillingDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void createPortalSession()}
              className="rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
            >
              Manage Billing
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#D7E2F5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A3263]">Usage</h2>
        <div className="mt-4 space-y-4">
          <UsageRow label="Projects" used={usage.projects.used} max={limits.projects} />
          <UsageRow label="Team Members" used={usage.users.used} max={limits.users} />
          <UsageRow label="Test Cases" used={usage.testCases.used} max={limits.testCases} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const isCurrent = card.key === plan
          return (
            <div
              key={card.key}
              className={`relative rounded-xl border bg-white p-5 shadow-sm ${
                isCurrent ? 'border-[#1A3263]' : 'border-[#D7E2F5]'
              }`}
            >
              {card.popular ? (
                <span className="absolute right-4 top-4 rounded-full bg-[#1A3263] px-2 py-1 text-[10px] font-semibold text-white">
                  Most Popular
                </span>
              ) : null}
              <h3 className="text-xl font-semibold text-[#1A3263]">{card.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5F87]">
                {card.features.map((feature) => (
                  <li key={feature}>+ {feature}</li>
                ))}
              </ul>
              {isCurrent ? (
                <p className="mt-4 text-sm font-semibold text-[#1A3263]">Current plan</p>
              ) : card.key === 'FREE' ? null : (
                <button
                  type="button"
                  disabled={busyPlan === card.key}
                  onClick={async () => {
                    setBusyPlan(card.key)
                    try {
                      await createCheckoutSession(card.key)
                    } finally {
                      setBusyPlan('')
                    }
                  }}
                  className="mt-4 w-full rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247] disabled:opacity-60"
                >
                  {busyPlan === card.key ? 'Redirecting...' : `Upgrade to ${card.title}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-[#D7E2F5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1A3263]">Billing History</h2>
        <p className="mt-2 text-sm text-[#4B5F87]">Manage invoices in the billing portal.</p>
        <button
          type="button"
          onClick={() => void createPortalSession()}
          className="mt-3 rounded-lg border border-[#C8D7F1] px-4 py-2 text-sm font-semibold text-[#1A3263] hover:bg-[#F5F8FF]"
        >
          Manage Invoices
        </button>
      </div>
    </div>
  )
}
