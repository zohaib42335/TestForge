import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { acceptInvitation } from '../api/users.api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token') || '', [params])
  const { isAuthenticated, consumeAuthPayload } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    if (!token) {
      setError('Invitation token is missing.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = isAuthenticated
        ? { token }
        : { token, displayName: displayName.trim(), password }
      const data = await acceptInvitation(payload)
      consumeAuthPayload(data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not accept invitation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#D5E0F3] bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1A3263]">Team Invitation</h1>
        <p className="mt-2 text-sm text-[#4D628C]">Join your team workspace on TestForge.</p>

        {!isAuthenticated ? (
          <div className="mt-5 space-y-4">
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display Name"
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-[#D5E0F3] bg-[#F4F7FF] px-3 py-2 text-sm text-[#1A3263]">
            You are signed in. Click below to join this company.
          </p>
        )}

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={() => void handleAccept()}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#122247] disabled:opacity-70"
        >
          {loading ? 'Joining...' : 'Join Company'}
        </button>
      </div>
    </div>
  )
}
