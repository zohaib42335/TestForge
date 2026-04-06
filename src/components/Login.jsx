/**
 * Login — Firebase authentication UI (Google + email/password + register).
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { LogoStacked } from './Logo.jsx'

const inputClass =
  'bg-white border border-orange-300 text-stone-900 rounded-lg px-3 py-2.5 w-full focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition placeholder:text-stone-400'
const labelClass = 'block text-sm text-stone-700 mb-1.5'

/**
 * @returns {import('react').JSX.Element}
 */
export default function Login() {
  const {
    configError,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithEmailPassword,
    registerWithEmailPassword,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState(/** @type {'signin' | 'register'} */ ('signin'))
  const [formHint, setFormHint] = useState('')

  /**
   * @param {import('react').FormEvent} e
   */
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    clearAuthError()
    setFormHint('')
    if (!email.trim()) {
      setFormHint('Please enter your email address.')
      return
    }
    if (!password) {
      setFormHint('Please enter your password.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailPassword(email, password)
      } else {
        await registerWithEmailPassword(email, password)
      }
    } finally {
      setBusy(false)
    }
  }

  /**
   * @returns {Promise<void>}
   */
  const handleGoogle = async () => {
    clearAuthError()
    setBusy(true)
    try {
      await signInWithGoogle()
    } finally {
      setBusy(false)
    }
  }

  const showError = configError || authError
  const disableForm = busy || !!configError

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-orange-50 text-stone-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoStacked size="lg" />
          </div>
          <p className="text-sm text-stone-500 mt-1">Sign in to manage test cases</p>
        </div>

        <div className="bg-white border border-orange-200 rounded-2xl p-8 shadow-sm">
          {(showError || formHint) && (
            <div
              className={`mb-6 rounded-lg px-4 py-3 text-sm border-l-4 ${
                formHint && !showError
                  ? 'bg-amber-50 border-amber-500 text-amber-800 border border-amber-200'
                  : 'bg-red-50 border-red-500 text-red-800 border border-red-200'
              }`}
              role="alert"
            >
              {formHint && !showError ? formHint : configError || authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={disableForm}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-orange-300 bg-white text-stone-900 font-semibold text-sm hover:bg-orange-50 transition disabled:bg-orange-200 disabled:text-orange-400 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-stone-500 font-mono">or</span>
            </div>
          </div>

          <div className="flex rounded-lg border border-orange-200 p-0.5 mb-4 bg-orange-50/50">
            <button
              type="button"
              onClick={() => {
                clearAuthError()
                setFormHint('')
                setMode('signin')
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'signin'
                  ? 'bg-orange-500 text-white'
                  : 'text-stone-600 hover:text-orange-600'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                clearAuthError()
                setFormHint('')
                setMode('register')
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
                mode === 'register'
                  ? 'bg-orange-500 text-white'
                  : 'text-stone-600 hover:text-orange-600'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
            <div>
              <label className={labelClass} htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disableForm}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disableForm}
                className={inputClass}
                required
                minLength={6}
              />
              {mode === 'register' && (
                <p className="text-xs text-stone-500 mt-1">
                  Minimum 6 characters (Firebase requirement).
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={disableForm}
              className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition disabled:bg-orange-200 disabled:text-orange-400 disabled:cursor-not-allowed"
            >
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in with email'
                  : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-500 mt-6">
          Step 1: Authentication only — test data still uses local storage until Step 2.
        </p>
      </div>
    </div>
  )
}
