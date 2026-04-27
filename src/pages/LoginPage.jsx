import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

/* global google */

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, isLoading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const googleBtnRef = useRef(null)

  useEffect(() => {
    const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
    if (!clientId) return

    const existing = document.querySelector('script[data-google-gis="true"]')
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleGis = 'true'
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
    if (!clientId) return
    if (!googleBtnRef.current) return
    const google = window.google
    if (!google?.accounts?.id) return

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential)
          const redirectTo = location.state?.from?.pathname || '/dashboard'
          navigate(redirectTo, { replace: true })
        } catch (err) {
          setError(err?.response?.data?.error?.message || 'Google sign-in failed.')
        }
      },
    })

    googleBtnRef.current.innerHTML = ''
    google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 360,
      text: 'continue_with',
      shape: 'pill',
    })
  }, [loginWithGoogle, location.state?.from?.pathname, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      await login(form)
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#D5E0F3] bg-white p-7 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo className="h-10 w-auto" />
          <h1 className="text-2xl font-semibold text-[#1A3263]">Log in to TestForge</h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 pr-10 outline-none focus:border-[#1A3263]"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5A6E9A] hover:text-[#1A3263]"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.1 5.1A10.9 10.9 0 0 1 12 4c7 0 10 8 10 8a17.3 17.3 0 0 1-3.2 4.5" />
                    <path d="M6.6 6.6A17.3 17.3 0 0 0 2 12s3 8 10 8c1.3 0 2.5-.3 3.6-.7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#122247] disabled:opacity-70"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        {String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() ? (
          <div className="mt-4">
            <div className="my-3 flex items-center gap-3 text-xs text-[#5A6E9A]">
              <div className="h-px flex-1 bg-[#E5ECFA]" />
              <span>or</span>
              <div className="h-px flex-1 bg-[#E5ECFA]" />
            </div>
            <div ref={googleBtnRef} />
          </div>
        ) : null}
        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-[#1A3263] hover:underline">
            Forgot password?
          </Link>
          <Link to="/signup" className="font-semibold text-[#1A3263] hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
