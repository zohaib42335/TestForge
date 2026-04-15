import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth.api.js'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token) {
      setError('Reset token is missing.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#D5E0F3] bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1A3263]">Reset Password</h1>
        {success ? (
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Password reset successful. You can now log in with your new password.
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A3263]">New password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1A3263]">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
              />
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#122247] disabled:opacity-70"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
        <div className="mt-5 text-sm">
          <Link to="/login" className="font-semibold text-[#1A3263] hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
