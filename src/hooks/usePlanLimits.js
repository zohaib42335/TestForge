import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSubscription } from '../api/billing.api.js'

function pct(used, max) {
  if (!max || max <= 0) return 0
  return (used / max) * 100
}

export default function usePlanLimits() {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSubscription()
      setSubscription(data)
    } catch {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const usage = useMemo(
    () => ({
      projects: {
        used: subscription?.usage?.projects ?? 0,
        max: subscription?.limits?.projects ?? 0,
      },
      users: {
        used: subscription?.usage?.users ?? 0,
        max: subscription?.limits?.users ?? 0,
      },
      testCases: {
        used: subscription?.usage?.testCases ?? 0,
        max: subscription?.limits?.testCases ?? 0,
      },
    }),
    [subscription],
  )

  const isAtLimit = useMemo(
    () => ({
      projects: usage.projects.used >= usage.projects.max,
      users: usage.users.used >= usage.users.max,
      testCases: usage.testCases.used >= usage.testCases.max,
    }),
    [usage],
  )

  const isNearLimit = useMemo(
    () => ({
      projects: pct(usage.projects.used, usage.projects.max) >= 80,
      users: pct(usage.users.used, usage.users.max) >= 80,
      testCases: pct(usage.testCases.used, usage.testCases.max) >= 80,
    }),
    [usage],
  )

  return {
    loading,
    refetch,
    plan: subscription?.plan ?? 'FREE',
    subscriptionStatus: subscription?.subscriptionStatus ?? 'ACTIVE',
    usage,
    limits: subscription?.limits ?? { projects: 0, users: 0, testCases: 0 },
    isAtLimit,
    isNearLimit,
    nextBillingDate: subscription?.nextBillingDate ?? null,
  }
}
