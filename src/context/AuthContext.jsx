import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  apiClient,
  getAccessToken,
  getMe,
  login as loginApi,
  logout as logoutApi,
  refreshToken as refreshTokenApi,
  setAccessToken,
  signup as signupApi,
} from '../api/auth.api.js'

/**
 * @param {unknown} err
 * @returns {string}
 */
/** @type {import('react').Context<AuthContextValue|null>} */
const AuthContext = createContext(null)

const REFRESH_TOKEN_STORAGE_KEY = 'testforge_refresh_token'

/**
 * @typedef {Object} AuthContextValue
 * @property {Record<string, unknown>|null} currentUser
 * @property {Record<string, unknown>|null} userProfile
 * @property {boolean} isLoading
 * @property {boolean} isAuthenticated
 * @property {(payload: { email: string, password: string }) => Promise<Record<string, unknown>|null>} login
 * @property {(payload: { displayName: string, email: string, password: string, companyName: string }) => Promise<Record<string, unknown>|null>} signup
 * @property {() => Promise<void>} logout
 * @property {(payload: Record<string, unknown>) => void} consumeAuthPayload
 * @property {boolean} isAdmin
 * @property {boolean} isQAManager
 * @property {boolean} isTester
 * @property {boolean} isViewer
 */

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const persistRefreshToken = useCallback((token) => {
    if (!token) {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
      return
    }
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token)
  }, [])

  const applySession = useCallback((payload) => {
    setAccessToken(payload?.accessToken ?? null)
    persistRefreshToken(payload?.refreshToken ?? null)
    setUserProfile(payload?.user ?? null)
  }, [persistRefreshToken])

  const clearSession = useCallback(() => {
    setAccessToken(null)
    persistRefreshToken(null)
    setUserProfile(null)
  }, [persistRefreshToken])

  const refreshSession = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    if (!storedRefreshToken) {
      throw new Error('No refresh token available.')
    }

    const data = await refreshTokenApi(storedRefreshToken)
    applySession(data)
    return data
  }, [applySession])

  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config
        const status = error?.response?.status
        if (status !== 401 || !originalRequest || originalRequest._retry) {
          return Promise.reject(error)
        }

        originalRequest._retry = true
        try {
          await refreshSession()
          originalRequest.headers = originalRequest.headers ?? {}
          const token = getAccessToken()
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return apiClient(originalRequest)
        } catch (refreshError) {
          clearSession()
          return Promise.reject(refreshError)
        }
      },
    )

    return () => apiClient.interceptors.response.eject(interceptorId)
  }, [clearSession, refreshSession])

  const login = useCallback(async ({ email, password }) => {
    const data = await loginApi({ email, password })
    applySession(data)
    return data?.user ?? null
  }, [applySession])

  const signup = useCallback(async ({ displayName, email, password, companyName }) => {
    const data = await signupApi({ displayName, email, password, companyName })
    applySession(data)
    return data?.user ?? null
  }, [applySession])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    if (refreshToken) {
      try {
        await logoutApi(refreshToken)
      } catch {
        // Ignore logout API failures and clear client session regardless.
      }
    }
    clearSession()
  }, [clearSession])

  const consumeAuthPayload = useCallback((payload) => {
    applySession(payload)
  }, [applySession])

  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const me = await getMe()
        if (mounted) {
          setUserProfile(me)
        }
      } catch {
        try {
          const refreshed = await refreshSession()
          if (mounted) {
            setUserProfile(refreshed?.user ?? null)
          }
        } catch {
          if (mounted) {
            clearSession()
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [clearSession, refreshSession])

  const role = typeof userProfile?.role === 'string' ? userProfile.role : ''
  const isAdmin = role === 'ADMIN'
  const isQAManager = role === 'QA_MANAGER'
  const isTester = role === 'TESTER'
  const isViewer = role === 'VIEWER'
  const isAuthenticated = Boolean(userProfile)

  const value = useMemo(
    () => ({
      currentUser: userProfile,
      userProfile,
      login,
      signup,
      logout,
      consumeAuthPayload,
      isLoading,
      isAuthenticated,
      isAdmin,
      isQAManager,
      isTester,
      isViewer,
    }),
    [
      userProfile,
      login,
      signup,
      logout,
      consumeAuthPayload,
      isLoading,
      isAuthenticated,
      isAdmin,
      isQAManager,
      isTester,
      isViewer,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
