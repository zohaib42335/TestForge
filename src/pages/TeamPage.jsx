import { useCallback, useEffect, useMemo, useState } from 'react'
import InviteModal from '../components/InviteModal.jsx'
import {
  cancelInvitation,
  deactivateUser,
  getCompanyUsers,
  getPendingInvitations,
  resendInvitation,
  updateUserRole,
} from '../api/users.api.js'
import { useAuth } from '../context/AuthContext.jsx'
import usePlanLimits from '../hooks/usePlanLimits.js'
import PlanLimitModal from '../components/PlanLimitModal.jsx'

export default function TeamPage() {
  const { currentUser, isAdmin } = useAuth()
  const { isAtLimit, usage } = usePlanLimits()
  const [members, setMembers] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [users, invites] = await Promise.all([
        getCompanyUsers(),
        getPendingInvitations(),
      ])
      setMembers(Array.isArray(users) ? users : [])
      setPendingInvitations(Array.isArray(invites) ? invites : [])
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not load team data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const memberRows = useMemo(() => members, [members])
  const pendingRows = useMemo(() => pendingInvitations, [pendingInvitations])

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not update role.')
    }
  }

  const handleRemove = async (userId) => {
    try {
      await deactivateUser(userId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not remove user.')
    }
  }

  const handleResend = async (invitationId) => {
    try {
      await resendInvitation(invitationId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not resend invitation.')
    }
  }

  const handleCancelInvite = async (invitationId) => {
    try {
      await cancelInvitation(invitationId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not cancel invitation.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A3263]">Team Management</h1>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              if (isAtLimit.users) {
                setShowLimitModal(true)
              } else {
                setInviteOpen(true)
              }
            }}
            className="rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
          >
            Invite Member
          </button>
        ) : null}
      </div>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-[#4B5F87]">Loading team...</p> : null}

      <div className="rounded-xl border border-[#D7E2F5] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[#1A3263]">Team Members</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#53698F]">
              <tr>
                <th className="py-2 pr-3">Avatar</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((member) => {
                const isMe = member.id === currentUser?.id
                return (
                  <tr key={member.id} className={isMe ? 'bg-[#EEF2FB]' : 'border-t border-[#EEF2FB]'}>
                    <td className="py-2 pr-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A3263] text-xs font-semibold text-white">
                        {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="py-2 pr-3">{member.displayName}</td>
                    <td className="py-2 pr-3">{member.email}</td>
                    <td className="py-2 pr-3">
                      {isAdmin ? (
                        <select
                          value={member.role}
                          onChange={(event) => void handleRoleChange(member.id, event.target.value)}
                          disabled={isMe}
                          className="rounded-md border border-[#C8D7F1] px-2 py-1 disabled:opacity-70"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="QA_MANAGER">QA Manager</option>
                          <option value="TESTER">Tester</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      ) : (
                        member.role
                      )}
                    </td>
                    <td className="py-2 pr-3">{member.isActive ? 'Active' : 'Pending'}</td>
                    <td className="py-2 pr-3">{new Date(member.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-3">
                      {isAdmin && !isMe ? (
                        <button
                          type="button"
                          onClick={() => void handleRemove(member.id)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#D7E2F5] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[#1A3263]">Pending Invitations</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#53698F]">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Invited by</th>
                <th className="py-2 pr-3">Expires</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRows.map((invite) => (
                <tr key={invite.id} className="border-t border-[#EEF2FB]">
                  <td className="py-2 pr-3">{invite.email}</td>
                  <td className="py-2 pr-3">{invite.role}</td>
                  <td className="py-2 pr-3">{invite.invitedBy?.displayName || 'Unknown'}</td>
                  <td className="py-2 pr-3">{new Date(invite.expiresAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleResend(invite.id)}
                        className="text-[#1A3263] hover:underline"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancelInvite(invite.id)}
                        className="text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={loadData}
      />
      <PlanLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="users"
        used={usage.users.used}
        max={usage.users.max}
      />
    </div>
  )
}
