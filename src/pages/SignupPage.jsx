import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

/* global google */

function validate(values) {
  const errors = {}
  if (!values.displayName || values.displayName.trim().length < 2) {
    errors.displayName = 'Display name must be at least 2 characters.'
  }
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.companyName || values.companyName.trim().length < 2) {
    errors.companyName = 'Company name must be at least 2 characters.'
  }
  if (!values.password || values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  return errors
}

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signup, loginWithGoogle, isLoading } = useAuth()
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    companyName: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const googleBtnRef = useRef(null)

  const isSubmitting = useMemo(() => isLoading, [isLoading])

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
          setSubmitError(err?.response?.data?.error?.message || 'Google sign-in failed.')
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
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await signup(form)
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setSubmitError(error?.response?.data?.error?.message || 'Could not create account.')
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#D5E0F3] bg-white p-7 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo className="h-10 w-auto" />
          <h1 className="text-2xl font-semibold text-[#1A3263]">Create your account</h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Display Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
            {errors.displayName ? <p className="mt-1 text-xs text-red-600">{errors.displayName}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Company Name</label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
            {errors.companyName ? <p className="mt-1 text-xs text-red-600">{errors.companyName}</p> : null}
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
            {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
          </div>
          {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#122247] disabled:opacity-70"
          >
            {isSubmitting ? 'Creating account...' : 'Sign up'}
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
            <p className="mt-2 text-center text-xs text-[#5A6E9A]">
              Google sign-in is available for invited/existing users.
            </p>
          </div>
        ) : null}
        <p className="mt-5 text-center text-sm text-[#4B5F87]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#1A3263] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
