import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

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
  const { signup, isLoading } = useAuth()
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    companyName: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  const isSubmitting = useMemo(() => isLoading, [isLoading])

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
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
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
