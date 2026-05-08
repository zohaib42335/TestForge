import { useMemo, useState } from 'react'
import { inviteUser } from '../api/users.api.js'

const ROLE_OPTIONS = [
  { label: 'QA Manager', value: 'QA_MANAGER' },
  { label: 'Tester', value: 'TESTER' },
  { label: 'Viewer', value: 'VIEWER' },
]

export default function InviteModal({ open, onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('TESTER')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [warning, setWarning] = useState('')
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => email.trim() && role && !loading, [email, role, loading])
  if (!open) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setWarning('')
    try {
      const payload = { email: email.trim(), role }
      const data = await inviteUser(payload)
      const invitedEmail = data?.email || payload.email

      if (data?.emailSent === false) {
        // Invitation created in DB but email delivery failed — show amber warning
        setWarning(
          `Invitation created for ${invitedEmail}, but the email could not be delivered. ` +
          `The invitee appears in Pending Invitations — share the invite link with them directly.`
        )
      } else {
        setMessage(`Invitation sent to ${invitedEmail}`)
      }

      setEmail('')
      setRole('TESTER')
      if (typeof onInvited === 'function') {
        await onInvited()
      }
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.error
      setError(backendMessage || 'Could not send invitation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-[#1A3263]">Invite Team Member</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1A3263]">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-lg border border-[#C8D7F1] bg-white px-3 py-2 outline-none focus:border-[#1A3263]"
            >
              {ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {warning ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              ⚠️ {warning}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#C8D7F1] px-4 py-2 text-sm font-medium text-[#1A3263]"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
