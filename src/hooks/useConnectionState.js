/**
 * @fileoverview Tracks browser connectivity for UI indicators.
 */

import { useEffect, useState } from 'react'

/**
 * @returns {{ isOnline: boolean }}
 */
export function useConnectionState() {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine,
  )

  useEffect(() => {
    const onBrowserOnline = () => setIsOnline(true)
    const onBrowserOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', onBrowserOnline)
      window.addEventListener('offline', onBrowserOffline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onBrowserOnline)
        window.removeEventListener('offline', onBrowserOffline)
      }
    }
  }, [])

  return { isOnline }
}
